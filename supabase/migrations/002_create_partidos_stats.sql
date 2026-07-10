-- Tabla que almacena estadísticas extraídas por IA de pantallas de resultados
-- Cada fila corresponde a las estadísticas de un partido (FK opcional a partidos)
-- Los campos JSONB permiten almacenar datos dinámicos sin cambios de esquema
CREATE TABLE IF NOT EXISTS partidos_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  partido_id UUID REFERENCES partidos(id) ON DELETE CASCADE,     -- FK al partido (opcional para backward compat)
  nombre_local TEXT,                                               -- Nombre del equipo local detectado por IA
  nombre_visitante TEXT,                                           -- Nombre del equipo visitante detectado por IA
  goles_local INTEGER CHECK (goles_local >= 0),                   -- Goles local (extraídos de la imagen)
  goles_visitante INTEGER CHECK (goles_visitante >= 0),           -- Goles visitante (extraídos de la imagen)
  tiempo_partido TEXT,                                             -- Tiempo del partido (ej: "90:00", "45:00")
  estadisticas_tabla JSONB,                                       -- Estadísticas generales: posesión, tiros, etc.
  rendimiento_general JSONB,                                      -- Rendimiento global: % regates, tiros, pases
  jugadores_stats JSONB DEFAULT '[]'                              -- Stats individuales por jugador
);

-- Políticas de seguridad: solo usuarios autenticados pueden insertar
ALTER TABLE partidos_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insertar stats autenticados"
  ON partidos_stats FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas de seguridad: cualquier persona puede leer estadísticas
CREATE POLICY "Leer stats público"
  ON partidos_stats FOR SELECT
  TO anon
  USING (true);
