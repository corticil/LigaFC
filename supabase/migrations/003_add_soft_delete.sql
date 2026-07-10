-- Soft delete: columna eliminado_en en partidos y partidos_stats
-- NULL = activo, timestamp = eliminado (soft delete)
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE partidos_stats ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Índices para filtrar rápido solo registros activos
CREATE INDEX IF NOT EXISTS idx_partidos_no_eliminados ON partidos (eliminado_en) WHERE eliminado_en IS NULL;
CREATE INDEX IF NOT EXISTS idx_partidos_stats_no_eliminados ON partidos_stats (eliminado_en) WHERE eliminado_en IS NULL;
