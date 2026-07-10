-- Agrega la columna torneo_id a partidos para vincular cada partido a un torneo
-- FK opcional: puede ser NULL para partidos que no pertenecen a ningún torneo
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS torneo_id UUID REFERENCES torneos(id) ON DELETE SET NULL DEFAULT NULL;
