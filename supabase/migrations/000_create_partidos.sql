-- Migration 000: Create partidos table (base table for all match data)
-- This must run BEFORE all other migrations.

CREATE TABLE IF NOT EXISTS partidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jugador_1 TEXT NOT NULL,
  jugador_2 TEXT NOT NULL,
  equipo_1_id TEXT NOT NULL,
  equipo_2_id TEXT NOT NULL,
  goles_1 INTEGER NOT NULL CHECK (goles_1 >= 0),
  goles_2 INTEGER NOT NULL CHECK (goles_2 >= 0),
  nota TEXT DEFAULT '',
  fecha DATE DEFAULT current_date NOT NULL,
  torneo_id UUID REFERENCES torneos(id) ON DELETE SET NULL DEFAULT NULL,
  eliminado_en TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
