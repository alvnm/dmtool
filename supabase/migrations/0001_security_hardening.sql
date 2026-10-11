-- =====================================================================
-- Migración 0001: endurecimiento de seguridad sobre una base existente
-- Equivale a la sección de seguridad de supabase/schema.sql, más los
-- pasos de actualización necesarios cuando ya hay datos.
-- Aplicar con: supabase db push  (o copiando este archivo al SQL editor)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Propietario explícito en campaigns (backfill + NOT NULL)
-- ---------------------------------------------------------------------
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS dm_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill defensivo: si aún quedan campañas sin propietario y existe
-- exactamente un usuario, se le asignan. Si hay varios, quedan en NULL
-- y el DBA debe asignarlas a mano (el NOT NULL no se aplica hasta entonces).
DO $$
DECLARE v_count INT; v_single UUID;
BEGIN
  SELECT count(*) INTO v_count FROM auth.users;
  IF v_count = 1 THEN
    SELECT id INTO v_single FROM auth.users LIMIT 1;
    UPDATE public.campaigns SET dm_user_id = v_single WHERE dm_user_id IS NULL;
  END IF;
  SELECT count(*) INTO v_count FROM public.campaigns WHERE dm_user_id IS NULL;
  IF v_count = 0 THEN
    ALTER TABLE public.campaigns ALTER COLUMN dm_user_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'Quedan % campañas sin dm_user_id; asigna el propietario y vuelve a ejecutar ALTER COLUMN SET NOT NULL.', v_count;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. Compendio de hechizos: trazabilidad de autor
-- ---------------------------------------------------------------------
ALTER TABLE public.spells ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE public.spells SET created_by = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
WHERE created_by IS NULL;

-- ---------------------------------------------------------------------
-- 3. RLS habilitado y forzado en todas las tablas
-- ---------------------------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['campaigns','monsters','spells','npcs','items','encounters','initiative_combatants','dm_notes'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    -- Eliminar políticas heredadas de acceso público (USING (true))
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Allow public access ' || t, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 4. Helpers de autoría (SECURITY DEFINER, no expuestos a anon)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_campaign_owner(p_campaign_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = p_campaign_id AND c.dm_user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_campaign_owner(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_campaign_owner(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_encounter_owner(p_encounter_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.encounters e WHERE e.id = p_encounter_id AND public.is_campaign_owner(e.campaign_id));
$$;
REVOKE ALL ON FUNCTION public.is_encounter_owner(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_encounter_owner(UUID) TO authenticated;

-- ---------------------------------------------------------------------
-- 5. Políticas por propietario (reemplazan a las públicas)
-- ---------------------------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "campaigns_select_own" ON public.campaigns';
  EXECUTE 'DROP POLICY IF EXISTS "campaigns_insert_own" ON public.campaigns';
  EXECUTE 'DROP POLICY IF EXISTS "campaigns_update_own" ON public.campaigns';
  EXECUTE 'DROP POLICY IF EXISTS "campaigns_delete_own" ON public.campaigns';
  EXECUTE 'CREATE POLICY "campaigns_select_own" ON public.campaigns FOR SELECT TO authenticated USING (dm_user_id = auth.uid())';
  EXECUTE 'CREATE POLICY "campaigns_insert_own" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (dm_user_id = auth.uid())';
  EXECUTE 'CREATE POLICY "campaigns_update_own" ON public.campaigns FOR UPDATE TO authenticated USING (dm_user_id = auth.uid()) WITH CHECK (dm_user_id = auth.uid())';
  EXECUTE 'CREATE POLICY "campaigns_delete_own" ON public.campaigns FOR DELETE TO authenticated USING (dm_user_id = auth.uid())';

  FOREACH t IN ARRAY ARRAY['monsters','npcs','items','encounters','dm_notes'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select_own', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert_own', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update_own', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete_own', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_campaign_owner(campaign_id))', t || '_select_own', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_campaign_owner(campaign_id))', t || '_insert_own', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_campaign_owner(campaign_id)) WITH CHECK (public.is_campaign_owner(campaign_id))', t || '_update_own', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_campaign_owner(campaign_id))', t || '_delete_own', t);
  END LOOP;

  EXECUTE 'DROP POLICY IF EXISTS "initiative_combatants_select_own" ON public.initiative_combatants';
  EXECUTE 'DROP POLICY IF EXISTS "initiative_combatants_insert_own" ON public.initiative_combatants';
  EXECUTE 'DROP POLICY IF EXISTS "initiative_combatants_update_own" ON public.initiative_combatants';
  EXECUTE 'DROP POLICY IF EXISTS "initiative_combatants_delete_own" ON public.initiative_combatants';
  EXECUTE 'CREATE POLICY "initiative_combatants_select_own" ON public.initiative_combatants FOR SELECT TO authenticated USING (public.is_encounter_owner(encounter_id))';
  EXECUTE 'CREATE POLICY "initiative_combatants_insert_own" ON public.initiative_combatants FOR INSERT TO authenticated WITH CHECK (public.is_encounter_owner(encounter_id))';
  EXECUTE 'CREATE POLICY "initiative_combatants_update_own" ON public.initiative_combatants FOR UPDATE TO authenticated USING (public.is_encounter_owner(encounter_id)) WITH CHECK (public.is_encounter_owner(encounter_id))';
  EXECUTE 'CREATE POLICY "initiative_combatants_delete_own" ON public.initiative_combatants FOR DELETE TO authenticated USING (public.is_encounter_owner(encounter_id))';

  EXECUTE 'DROP POLICY IF EXISTS "spells_select_authenticated" ON public.spells';
  EXECUTE 'DROP POLICY IF EXISTS "spells_insert_own" ON public.spells';
  EXECUTE 'DROP POLICY IF EXISTS "spells_update_own" ON public.spells';
  EXECUTE 'DROP POLICY IF EXISTS "spells_delete_own" ON public.spells';
  EXECUTE 'CREATE POLICY "spells_select_authenticated" ON public.spells FOR SELECT TO authenticated USING (true)';
  EXECUTE 'CREATE POLICY "spells_insert_own" ON public.spells FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid())';
  EXECUTE 'CREATE POLICY "spells_update_own" ON public.spells FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid())';
  EXECUTE 'CREATE POLICY "spells_delete_own" ON public.spells FOR DELETE TO authenticated USING (created_by = auth.uid())';
END $$;

-- ---------------------------------------------------------------------
-- 6. Privilegios: anon sin acceso a datos; authenticated filtrado por RLS
-- ---------------------------------------------------------------------
REVOKE ALL ON public.campaigns, public.monsters, public.spells, public.npcs,
  public.items, public.encounters, public.initiative_combatants, public.dm_notes
  FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns, public.monsters,
  public.spells, public.npcs, public.items, public.encounters,
  public.initiative_combatants, public.dm_notes
  TO authenticated;

-- ---------------------------------------------------------------------
-- 7. Protección de campos inmutables (anti-manipulación de IDs/fechas)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_immutable_columns()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Campo inmutable no puede modificarse: id';
    END IF;
    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Campo inmutable no puede modificarse: created_at';
    END IF;
    IF TG_TABLE_NAME = 'campaigns' AND NEW.dm_user_id IS DISTINCT FROM OLD.dm_user_id THEN
      RAISE EXCEPTION 'Campo inmutable no puede modificarse: dm_user_id';
    END IF;
    IF TG_TABLE_NAME <> 'campaigns' AND NEW.campaign_id IS DISTINCT FROM OLD.campaign_id THEN
      RAISE EXCEPTION 'Campo inmutable no puede modificarse: campaign_id';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['campaigns','monsters','spells','npcs','items','encounters','initiative_combatants','dm_notes'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_protect_immutable ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_protect_immutable BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.protect_immutable_columns()', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_set_updated_at ON public.dm_notes;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.dm_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- 8. Restricciones de integridad (validación también en la BD)
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monsters_ac_range') THEN
    ALTER TABLE public.monsters ADD CONSTRAINT monsters_ac_range CHECK (ac BETWEEN 0 AND 999);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monsters_hp_range') THEN
    ALTER TABLE public.monsters ADD CONSTRAINT monsters_hp_range CHECK (hp_max BETWEEN 0 AND 100000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'npcs_name_len') THEN
    ALTER TABLE public.npcs ADD CONSTRAINT npcs_name_len CHECK (char_length(name) BETWEEN 1 AND 200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'items_weight_range') THEN
    ALTER TABLE public.items ADD CONSTRAINT items_weight_range CHECK (weight >= 0 AND value_gp >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'initiative_hp_range') THEN
    ALTER TABLE public.initiative_combatants ADD CONSTRAINT initiative_hp_range CHECK (hp_current >= 0 AND hp_max >= 0);
  END IF;
END $$;
