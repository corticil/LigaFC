-- Fix: las políticas originales usaban "authenticated" pero la app usa "anon"
-- Drop políticas antiguas y recrear para que funcione con anon

-- === TORNEOS ===
DROP POLICY IF EXISTS "Leer torneos público" ON torneos;
DROP POLICY IF EXISTS "Gestionar torneos autenticados" ON torneos;

CREATE POLICY "Leer torneos público"
  ON torneos FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Insertar torneos"
  ON torneos FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Actualizar torneos"
  ON torneos FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Eliminar torneos"
  ON torneos FOR DELETE
  TO anon
  USING (true);

-- === PARTIDOS_STATS ===
DROP POLICY IF EXISTS "Insertar stats autenticados" ON partidos_stats;
DROP POLICY IF EXISTS "Leer stats público" ON partidos_stats;

CREATE POLICY "Leer stats público"
  ON partidos_stats FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Insertar stats"
  ON partidos_stats FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Actualizar stats"
  ON partidos_stats FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Eliminar stats"
  ON partidos_stats FOR DELETE
  TO anon
  USING (true);
