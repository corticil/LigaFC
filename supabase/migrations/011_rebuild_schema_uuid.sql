-- Migration 011: Full schema rebuild with proper UUID types
-- All new tables keep _v2 suffix — no renaming
-- Run as a SINGLE transaction in Supabase SQL Editor

BEGIN;

-- ============================================================
-- 1. jugadores_v2: UUID id
-- ============================================================
CREATE TABLE jugadores_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO jugadores_v2 (id, nombre, created_at)
SELECT id::uuid, nombre, created_at FROM jugadores;

-- ============================================================
-- 2. equipos_v2: UUID id
-- ============================================================
CREATE TABLE equipos_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO equipos_v2 (id, nombre, slug, logo_url, created_at)
SELECT id::uuid, nombre, slug, logo_url, created_at FROM equipos;

-- ============================================================
-- 3. partidos_v2: UUID FKs for players and teams
-- ============================================================
CREATE TABLE partidos_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jugador_1 TEXT NOT NULL,
  jugador_2 TEXT NOT NULL,
  jugador_1_id UUID REFERENCES jugadores_v2(id) ON DELETE SET NULL,
  jugador_2_id UUID REFERENCES jugadores_v2(id) ON DELETE SET NULL,
  equipo_1_id UUID REFERENCES equipos_v2(id) ON DELETE SET NULL,
  equipo_2_id UUID REFERENCES equipos_v2(id) ON DELETE SET NULL,
  goles_1 INTEGER NOT NULL CHECK (goles_1 >= 0),
  goles_2 INTEGER NOT NULL CHECK (goles_2 >= 0),
  nota TEXT DEFAULT '',
  fecha DATE DEFAULT current_date NOT NULL,
  torneo_id UUID REFERENCES torneos(id) ON DELETE SET NULL DEFAULT NULL,
  eliminado_en TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Migrate data: resolve player names → UUIDs, team slugs/TEXT → UUIDs
INSERT INTO partidos_v2 (id, jugador_1, jugador_2, jugador_1_id, jugador_2_id, equipo_1_id, equipo_2_id, goles_1, goles_2, nota, fecha, torneo_id, eliminado_en, created_at)
SELECT
  p.id, p.jugador_1, p.jugador_2,
  j1.id, j2.id,
  e1.id, e2.id,
  p.goles_1, p.goles_2, p.nota, p.fecha,
  p.torneo_id, p.eliminado_en, p.created_at
FROM partidos p
LEFT JOIN jugadores_v2 j1 ON LOWER(TRIM(p.jugador_1)) = LOWER(TRIM(j1.nombre))
LEFT JOIN jugadores_v2 j2 ON LOWER(TRIM(p.jugador_2)) = LOWER(TRIM(j2.nombre))
LEFT JOIN equipos_v2 e1 ON (p.equipo_1_id = e1.id::text OR p.equipo_1_id = e1.slug)
LEFT JOIN equipos_v2 e2 ON (p.equipo_2_id = e2.id::text OR p.equipo_2_id = e2.slug);

-- ============================================================
-- 4. partidos_stats_v2: ON DELETE SET NULL, timestamp fix
-- ============================================================
CREATE TABLE partidos_stats_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  partido_id UUID REFERENCES partidos_v2(id) ON DELETE SET NULL,
  nombre_local TEXT,
  nombre_visitante TEXT,
  goles_local INTEGER CHECK (goles_local >= 0),
  goles_visitante INTEGER CHECK (goles_visitante >= 0),
  tiempo_partido TEXT,
  estadisticas_tabla JSONB,
  rendimiento_general JSONB,
  jugadores_stats JSONB DEFAULT '[]',
  eliminado_en TIMESTAMPTZ DEFAULT NULL
);

INSERT INTO partidos_stats_v2 (id, created_at, partido_id, nombre_local, nombre_visitante, goles_local, goles_visitante, tiempo_partido, estadisticas_tabla, rendimiento_general, jugadores_stats, eliminado_en)
SELECT id, created_at, partido_id, nombre_local, nombre_visitante, goles_local, goles_visitante, tiempo_partido, estadisticas_tabla, rendimiento_general, jugadores_stats, eliminado_en
FROM partidos_stats;

-- ============================================================
-- 5. Indexes
-- ============================================================
CREATE INDEX idx_partidos_v2_jugador_1_id ON partidos_v2 (jugador_1_id) WHERE jugador_1_id IS NOT NULL;
CREATE INDEX idx_partidos_v2_jugador_2_id ON partidos_v2 (jugador_2_id) WHERE jugador_2_id IS NOT NULL;
CREATE INDEX idx_partidos_v2_fecha ON partidos_v2 (fecha DESC);
CREATE INDEX idx_partidos_v2_torneo_id ON partidos_v2 (torneo_id) WHERE torneo_id IS NOT NULL;
CREATE INDEX idx_partidos_stats_v2_partido_id ON partidos_stats_v2 (partido_id);

-- ============================================================
-- 6. RLS policies
-- ============================================================
ALTER TABLE jugadores_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_jugadores_v2" ON jugadores_v2 FOR SELECT USING (true);
CREATE POLICY "auth_insert_jugadores_v2" ON jugadores_v2 FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_delete_jugadores_v2" ON jugadores_v2 FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_update_jugadores_v2" ON jugadores_v2 FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE equipos_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_equipos_v2" ON equipos_v2 FOR SELECT USING (true);
CREATE POLICY "auth_insert_equipos_v2" ON equipos_v2 FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_delete_equipos_v2" ON equipos_v2 FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_update_equipos_v2" ON equipos_v2 FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE partidos_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_partidos_v2" ON partidos_v2 FOR SELECT USING (true);
CREATE POLICY "auth_insert_partidos_v2" ON partidos_v2 FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_partidos_v2" ON partidos_v2 FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_partidos_v2" ON partidos_v2 FOR DELETE TO authenticated USING (true);

ALTER TABLE partidos_stats_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_partidos_stats_v2" ON partidos_stats_v2 FOR SELECT USING (true);
CREATE POLICY "auth_insert_partidos_stats_v2" ON partidos_stats_v2 FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_partidos_stats_v2" ON partidos_stats_v2 FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_partidos_stats_v2" ON partidos_stats_v2 FOR DELETE TO authenticated USING (true);

COMMIT;
