-- Fix: políticas RLS con Supabase Auth
-- Lecturas públicas (anon), escrituras solo autenticados

-- === TORNEOS ===
-- Drop políticas anteriores de 004
DROP POLICY IF EXISTS "Leer torneos público" ON torneos;
DROP POLICY IF EXISTS "Insertar torneos" ON torneos;
DROP POLICY IF EXISTS "Actualizar torneos" ON torneos;
DROP POLICY IF EXISTS "Eliminar torneos" ON torneos;

CREATE POLICY "Leer torneos público"
  ON torneos FOR SELECT TO anon USING (true);

CREATE POLICY "Insertar torneos"
  ON torneos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Actualizar torneos"
  ON torneos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Eliminar torneos"
  ON torneos FOR DELETE TO authenticated USING (true);

-- === PARTIDOS ===
DROP POLICY IF EXISTS "Leer partidos público" ON partidos;
DROP POLICY IF EXISTS "Insertar partidos autenticados" ON partidos;
DROP POLICY IF EXISTS "Actualizar partidos autenticados" ON partidos;
DROP POLICY IF EXISTS "Eliminar partidos autenticados" ON partidos;

CREATE POLICY "Leer partidos público"
  ON partidos FOR SELECT TO anon USING (true);

CREATE POLICY "Insertar partidos"
  ON partidos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Actualizar partidos"
  ON partidos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Eliminar partidos"
  ON partidos FOR DELETE TO authenticated USING (true);

-- === PARTIDOS_STATS ===
DROP POLICY IF EXISTS "Leer stats público" ON partidos_stats;
DROP POLICY IF EXISTS "Insertar stats" ON partidos_stats;
DROP POLICY IF EXISTS "Actualizar stats" ON partidos_stats;
DROP POLICY IF EXISTS "Eliminar stats" ON partidos_stats;

CREATE POLICY "Leer stats público"
  ON partidos_stats FOR SELECT TO anon USING (true);

CREATE POLICY "Insertar stats"
  ON partidos_stats FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Actualizar stats"
  ON partidos_stats FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Eliminar stats"
  ON partidos_stats FOR DELETE TO authenticated USING (true);
