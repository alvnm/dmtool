-- SQL Schema Blueprint for DM Companion (Supabase D&D 5e)

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    system TEXT DEFAULT 'D&D 5e',
    dm_user_id UUID, -- References auth.users(id) when auth is activated
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_combatants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_notes ENABLE ROW LEVEL SECURITY;

-- Allow public / anon access policies (o restricción por auth.uid())
CREATE POLICY "Allow public access campaigns" ON public.campaigns FOR ALL USING (true);
CREATE POLICY "Allow public access monsters" ON public.monsters FOR ALL USING (true);
CREATE POLICY "Allow public access spells" ON public.spells FOR ALL USING (true);
CREATE POLICY "Allow public access npcs" ON public.npcs FOR ALL USING (true);
CREATE POLICY "Allow public access items" ON public.items FOR ALL USING (true);
CREATE POLICY "Allow public access encounters" ON public.encounters FOR ALL USING (true);
CREATE POLICY "Allow public access initiative_combatants" ON public.initiative_combatants FOR ALL USING (true);
CREATE POLICY "Allow public access dm_notes" ON public.dm_notes FOR ALL USING (true);

-- SEED DATA (Datos de Prueba Iniciales)

-- 1. Campaña de Prueba
INSERT INTO public.campaigns (id, name, description, system) VALUES
('11111111-1111-1111-1111-111111111111', 'La Mina Perdida de Phandelver', 'Campaña clásica de introducción a D&D 5e', 'D&D 5e');

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
