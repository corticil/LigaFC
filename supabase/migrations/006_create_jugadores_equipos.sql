-- Migration 006: Create jugadores and equipos tables
-- Run this in Supabase SQL Editor

-- ─── jugadores ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jugadores (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_jugadores" ON jugadores
  FOR SELECT USING (true);

CREATE POLICY "auth_insert_jugadores" ON jugadores
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_delete_jugadores" ON jugadores
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_update_jugadores" ON jugadores
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ─── equipos ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_equipos" ON equipos
  FOR SELECT USING (true);

CREATE POLICY "auth_insert_equipos" ON equipos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_delete_equipos" ON equipos
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_update_equipos" ON equipos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ─── Seed existing players ──────────────────────────────────────────────────
INSERT INTO jugadores (nombre) VALUES
  ('Guille'),
  ('Checho'),
  ('Seba'),
  ('Mambo')
ON CONFLICT (nombre) DO NOTHING;

-- ─── Seed existing teams ────────────────────────────────────────────────────
INSERT INTO equipos (nombre, slug, logo_url) VALUES
  ('Real Madrid', 'real-madrid', '/logos/real-madrid.svg'),
  ('FC Barcelona', 'barcelona', '/logos/barcelona.svg'),
  ('Manchester City', 'man-city', '/logos/man-city.svg'),
  ('Liverpool FC', 'liverpool', '/logos/liverpool.svg'),
  ('Paris Saint-Germain', 'psg', '/logos/psg.svg'),
  ('FC Bayern München', 'bayern-munich', '/logos/bayern-munich.svg'),
  ('Arsenal FC', 'arsenal', '/logos/arsenal.svg'),
  ('Chelsea FC', 'chelsea', '/logos/chelsea.svg'),
  ('Manchester United', 'man-united', '/logos/man-united.svg'),
  ('Atlético de Madrid', 'atletico-madrid', '/logos/atletico-madrid.svg'),
  ('Juventus FC', 'juventus', '/logos/juventus.svg'),
  ('AC Milan', 'ac-milan', '/logos/ac-milan.svg'),
  ('Inter de Milán', 'inter-milan', '/logos/inter-milan.svg'),
  ('Borussia Dortmund', 'borussia-dortmund', '/logos/borussia-dortmund.svg'),
  ('Bayer 04 Leverkusen', 'bayer-leverkusen', '/logos/bayer-leverkusen.svg'),
  ('Tottenham Hotspur', 'tottenham', '/logos/tottenham.svg')
ON CONFLICT (slug) DO NOTHING;
