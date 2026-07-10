-- Tabla de torneos para agrupar partidos en competiciones
-- Soporta nombre, fechas y se vincula a partidos mediante partidos.torneo_id
CREATE TABLE IF NOT EXISTS torneos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio DATE,
  fecha_fin DATE
);

-- Políticas de seguridad
ALTER TABLE torneos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leer torneos público"
  ON torneos FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Gestionar torneos autenticados"
  ON torneos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
