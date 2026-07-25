-- ============================================================
-- 013: Tabla de relación torneos ↔ jugadores
-- ============================================================

CREATE TABLE IF NOT EXISTS torneo_jugadores (
  torneo_id   UUID REFERENCES torneos(id) ON DELETE CASCADE NOT NULL,
  jugador_id  UUID REFERENCES jugadores_v2(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (torneo_id, jugador_id)
);

-- Migrar torneos existentes: asignar todos los jugadores a cada torneo
INSERT INTO torneo_jugadores (torneo_id, jugador_id)
SELECT t.id, j.id
FROM torneos t
CROSS JOIN jugadores_v2 j
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE torneo_jugadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_torneo_jugadores"
  ON torneo_jugadores FOR SELECT
  USING (true);

CREATE POLICY "auth_insert_torneo_jugadores"
  ON torneo_jugadores FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "auth_delete_torneo_jugadores"
  ON torneo_jugadores FOR DELETE
  TO authenticated
  USING (true);
