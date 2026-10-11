-- SQL Schema Blueprint for DM Companion (Supabase D&D 5e)

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    system TEXT DEFAULT 'D&D 5e',
    dm_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Propietario de la campaña
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT campaigns_name_len CHECK (char_length(name) BETWEEN 1 AND 200)
);

-- 2. MONSTERS TABLE
CREATE TABLE IF NOT EXISTS public.monsters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    size TEXT DEFAULT 'Mediano',
    type TEXT NOT NULL,
    alignment TEXT DEFAULT 'Neutral Malvado',
    ac INT NOT NULL DEFAULT 10,
    hp_max INT NOT NULL DEFAULT 10,
    speed TEXT DEFAULT '30 ft.',
    stats JSONB DEFAULT '{"str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10}'::jsonb,
    cr TEXT DEFAULT '1',
    actions JSONB DEFAULT '[]'::jsonb,
    traits JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SPELLS TABLE
CREATE TABLE IF NOT EXISTS public.spells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    level INT NOT NULL DEFAULT 0, -- 0 for Cantrip
    school TEXT NOT NULL,
    casting_time TEXT NOT NULL DEFAULT '1 Acción',
    range TEXT NOT NULL DEFAULT '60 ft.',
    components TEXT NOT NULL DEFAULT 'V, S',
    duration TEXT NOT NULL DEFAULT 'Instantáneo',
    description TEXT NOT NULL,
    classes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. NPCS TABLE
CREATE TABLE IF NOT EXISTS public.npcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    race TEXT NOT NULL,
    alignment TEXT DEFAULT 'Neutral',
    background TEXT,
    personality TEXT,
    disposition TEXT DEFAULT 'Neutral', -- Aliado, Amigable, Neutral, Hostil, Enemigo
    location TEXT,
    secret_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ITEMS TABLE (Inventario y Tesoros)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'General', -- Arma, Armadura, Poción, Pergamino, Anillo, Tesoro
    rarity TEXT DEFAULT 'Común', -- Común, Poco Común, Raro, Muy Raro, Legendario, Artefacto
    weight NUMERIC(6, 2) DEFAULT 0.0,
    value_gp NUMERIC(10, 2) DEFAULT 0.0,
    assigned_to TEXT DEFAULT 'Bolsa General',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ENCOUNTERS TABLE (Encuentros y Combates)
CREATE TABLE IF NOT EXISTS public.encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    location TEXT,
    difficulty TEXT DEFAULT 'Medio', -- Fácil, Medio, Difícil, Mortal
    status TEXT DEFAULT 'Planificado', -- Planificado, En Curso, Completado
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. INITIATIVE COMBATANTS TABLE
CREATE TABLE IF NOT EXISTS public.initiative_combatants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES public.encounters(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    initiative INT NOT NULL DEFAULT 0,
    hp_current INT NOT NULL DEFAULT 10,
    hp_max INT NOT NULL DEFAULT 10,
    ac INT NOT NULL DEFAULT 10,
    is_player BOOLEAN DEFAULT false,
    conditions TEXT[] DEFAULT '{}',
    turn_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. DM QUICK NOTES TABLE
CREATE TABLE IF NOT EXISTS public.dm_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Nota de Campaña',
    content TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    pinned BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS): ACCESO POR PROPIETARIO, NO PÚBLICO
-- Regla: sin política explícita, no hay acceso. Las políticas públicas
-- anteriores (USING (true)) quedan eliminadas por completo.
-- =====================================================================

-- La tabla spells es un compendio compartido: legible por usuarios
-- autenticados, escribible solo por su creador.
ALTER TABLE public.spells ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- RLS habilitado Y forzado (aplica también al dueño de la tabla/rol service)
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns FORCE ROW LEVEL SECURITY;
ALTER TABLE public.monsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monsters FORCE ROW LEVEL SECURITY;
ALTER TABLE public.spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spells FORCE ROW LEVEL SECURITY;
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npcs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters FORCE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_combatants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_combatants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.dm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_notes FORCE ROW LEVEL SECURITY;

-- Eliminar cualquier política heredada de accesos públicos
DROP POLICY IF EXISTS "Allow public access campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow public access monsters" ON public.monsters;
DROP POLICY IF EXISTS "Allow public access spells" ON public.spells;
DROP POLICY IF EXISTS "Allow public access npcs" ON public.npcs;
DROP POLICY IF EXISTS "Allow public access items" ON public.items;
DROP POLICY IF EXISTS "Allow public access encounters" ON public.encounters;
DROP POLICY IF EXISTS "Allow public access initiative_combatants" ON public.initiative_combatants;
DROP POLICY IF EXISTS "Allow public access dm_notes" ON public.dm_notes;

-- ---------------------------------------------------------------------
-- Helper: ¿esta fila pertenece a una campaña del usuario autenticado?
-- SECURITY DEFINER evita bucles de RLS y centraliza la comprobación.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_campaign_owner(p_campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = p_campaign_id AND c.dm_user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.is_campaign_owner(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_campaign_owner(UUID) TO authenticated;

-- Helper: el combate pertenece a un encuentro de una campaña del usuario
CREATE OR REPLACE FUNCTION public.is_encounter_owner(p_encounter_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.encounters e
    WHERE e.id = p_encounter_id AND public.is_campaign_owner(e.campaign_id)
  );
$$;
REVOKE ALL ON FUNCTION public.is_encounter_owner(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_encounter_owner(UUID) TO authenticated;

-- ---------------------------------------------------------------------
-- CAMPAIGNS: solo el DM propietario
-- ---------------------------------------------------------------------
CREATE POLICY "campaigns_select_own" ON public.campaigns
  FOR SELECT TO authenticated USING (dm_user_id = auth.uid());
CREATE POLICY "campaigns_insert_own" ON public.campaigns
  FOR INSERT TO authenticated WITH CHECK (dm_user_id = auth.uid());
CREATE POLICY "campaigns_update_own" ON public.campaigns
  FOR UPDATE TO authenticated USING (dm_user_id = auth.uid()) WITH CHECK (dm_user_id = auth.uid());
CREATE POLICY "campaigns_delete_own" ON public.campaigns
  FOR DELETE TO authenticated USING (dm_user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Tablas con campaign_id: acceso solo vía campaña propia del DM
-- (monsters, npcs, items, encounters, dm_notes)
-- ---------------------------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['monsters','npcs','items','encounters','dm_notes'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select_own', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert_own', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update_own', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete_own', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_campaign_owner(campaign_id))',
      t || '_select_own', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_campaign_owner(campaign_id))',
      t || '_insert_own', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_campaign_owner(campaign_id)) WITH CHECK (public.is_campaign_owner(campaign_id))',
      t || '_update_own', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_campaign_owner(campaign_id))',
      t || '_delete_own', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- INITIATIVE_COMBATANTS: vía encuentro -> campaña del usuario
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "initiative_combatants_select_own" ON public.initiative_combatants;
DROP POLICY IF EXISTS "initiative_combatants_insert_own" ON public.initiative_combatants;
DROP POLICY IF EXISTS "initiative_combatants_update_own" ON public.initiative_combatants;
DROP POLICY IF EXISTS "initiative_combatants_delete_own" ON public.initiative_combatants;
CREATE POLICY "initiative_combatants_select_own" ON public.initiative_combatants
  FOR SELECT TO authenticated USING (public.is_encounter_owner(encounter_id));
CREATE POLICY "initiative_combatants_insert_own" ON public.initiative_combatants
  FOR INSERT TO authenticated WITH CHECK (public.is_encounter_owner(encounter_id));
CREATE POLICY "initiative_combatants_update_own" ON public.initiative_combatants
  FOR UPDATE TO authenticated USING (public.is_encounter_owner(encounter_id)) WITH CHECK (public.is_encounter_owner(encounter_id));
CREATE POLICY "initiative_combatants_delete_own" ON public.initiative_combatants
  FOR DELETE TO authenticated USING (public.is_encounter_owner(encounter_id));

-- ---------------------------------------------------------------------
-- SPELLS: compendio compartido (solo lectura para autenticados),
-- escritura exclusivamente por su creador.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "spells_select_authenticated" ON public.spells;
DROP POLICY IF EXISTS "spells_insert_own" ON public.spells;
DROP POLICY IF EXISTS "spells_update_own" ON public.spells;
DROP POLICY IF EXISTS "spells_delete_own" ON public.spells;
CREATE POLICY "spells_select_authenticated" ON public.spells
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "spells_insert_own" ON public.spells
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "spells_update_own" ON public.spells
  FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "spells_delete_own" ON public.spells
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- ---------------------------------------------------------------------
-- PRIVILEGIOS: el rol anon NO tiene acceso a ninguna tabla.
-- Los clientes del navegador usan la sesión del usuario autenticado,
-- filtrada por las políticas anteriores.
-- ---------------------------------------------------------------------
REVOKE ALL ON public.campaigns, public.monsters, public.spells, public.npcs,
  public.items, public.encounters, public.initiative_combatants, public.dm_notes
  FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns, public.monsters,
  public.spells, public.npcs, public.items, public.encounters,
  public.initiative_combatants, public.dm_notes
  TO authenticated;

-- ---------------------------------------------------------------------
-- PROTECCIÓN DE CAMPOS INMUTABLES: impide manipular id, campaign_id,
-- created_at o dm_user_id por UPDATE (evita "escalada" de registros).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_immutable_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Campo inmutable no puede modificarse: id';
    END IF;
    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Campo inmutable no puede modificarse: created_at';
    END IF;
    IF TG_TABLE_NAME IN ('campaigns') AND NEW.dm_user_id IS DISTINCT FROM OLD.dm_user_id THEN
      RAISE EXCEPTION 'Campo inmutable no puede modificarse: dm_user_id';
    END IF;
    IF NEW.campaign_id IS DISTINCT FROM OLD.campaign_id AND TG_TABLE_NAME <> 'campaigns' THEN
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
    EXECUTE format(
      'CREATE TRIGGER trg_protect_immutable BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.protect_immutable_columns()',
      t);
  END LOOP;
END $$;

-- updated_at automático en dm_notes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_set_updated_at ON public.dm_notes;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.dm_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SEED DATA (Datos de Prueba Iniciales)

-- 1. Campaña de Prueba (solo si existe un usuario autenticado de prueba;
-- con RLS activo, las filas siempre pertenecen a un DM concreto)
DO $$
DECLARE v_user UUID;
BEGIN
  SELECT id INTO v_user FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF v_user IS NOT NULL THEN
    INSERT INTO public.campaigns (id, name, description, system, dm_user_id)
    VALUES ('11111111-1111-1111-1111-111111111111', 'La Mina Perdida de Phandelver',
            'Campaña clásica de introducción a D&D 5e', 'D&D 5e', v_user)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 2. Monstruos Populares
INSERT INTO public.monsters (campaign_id, name, size, type, alignment, ac, hp_max, speed, stats, cr, traits, actions) VALUES
('11111111-1111-1111-1111-111111111111', 'Duende (Goblin)', 'Pequeño', 'Humanoide', 'Neutral Malvado', 15, 7, '30 ft.', '{"str": 8, "dex": 14, "con": 10, "int": 10, "wis": 8, "cha": 8}', '1/4',
'[{"name": "Escape Escurridizo", "desc": "Puede Destrabar o Esconderse como acción adicional en su turno."}]',
'[{"name": "Cimitarra", "desc": "+4 al ataque, alcance 5 ft. Daño: 5 (1d6 + 2) cortante."}, {"name": "Arco Corto", "desc": "+4 al ataque, alcance 80/320 ft. Daño: 5 (1d6 + 2) perforante."}]'),

('11111111-1111-1111-1111-111111111111', 'Dragón Rojo Joven', 'Grande', 'Dragón', 'Caótico Malvado', 18, 178, '40 ft., volar 80 ft.', '{"str": 23, "dex": 10, "con": 21, "int": 14, "wis": 11, "cha": 19}', '10',
'[{"name": "Vista Ciega", "desc": "Percepción a ciegas 30 ft. y visión en oscuridad 120 ft."}]',
'[{"name": "Multiataque", "desc": "Realiza tres ataques: uno con mordedura y dos con garras."}, {"name": "Aliento de Fuego", "desc": "Cono de 30 ft., salvación de Destreza DC 17 o 56 (16d6) de daño de fuego."}]');

-- 3. Hechizos Populares
INSERT INTO public.spells (name, level, school, casting_time, range, components, duration, description, classes) VALUES
('Bola de Fuego (Fireball)', 3, 'Evocación', '1 Acción', '150 ft.', 'V, S, M (una bola de guano y azufre)', 'Instantáneo', 'Una brillante centella brota de tu dedo. Explota en una esfera de fuego de 20 pies de radio. Cada criatura sufre 8d6 de daño de fuego en salvación fallida de Destreza.', ARRAY['Mago', 'Hechicero']),
('Curar Heridas (Cure Wounds)', 1, 'Evocación', '1 Acción', 'Toque', 'V, S', 'Instantáneo', 'Una criatura que toques recupera 1d8 + tu modificador por habilidad de conjuros.', ARRAY['Clérigo', 'Bardo', 'Paladín', 'Explorador', 'Druida']);

-- 4. Objetos e Inventario
INSERT INTO public.items (campaign_id, name, type, rarity, weight, value_gp, assigned_to, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Poción de Curación', 'Poción', 'Común', 0.5, 50, 'Bolsa General', 'Restaura 2d4+2 puntos de vida.'),
('11111111-1111-1111-1111-111111111111', 'Espada Larga +1', 'Arma', 'Poco Común', 3.0, 500, 'Valerius', '+1 al ataque y daño con este arma mágica.');

-- 5. Encuentros
INSERT INTO public.encounters (id, campaign_id, title, location, difficulty, status, notes) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Emboscada en el Camino Real', 'Camino a Phandalin', 'Medio', 'En Curso', 'Los goblins atacan desde los arbustos al cruzar el carro.');
