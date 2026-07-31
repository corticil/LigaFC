-- Migration 014: Drop all unused tables (legacy pre-_v2 schema)
-- Keeps ONLY the tables the app currently uses:
--   partidos_v2, partidos_stats_v2, jugadores_v2, equipos_v2, torneos, torneo_jugadores
-- WARNING: Destructive. Run AFTER confirming all data is migrated to the _v2 tables.

BEGIN;

DO $$
DECLARE
  r RECORD;
  dropped TEXT := '';
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN (
        'partidos_v2',
        'partidos_stats_v2',
        'jugadores_v2',
        'equipos_v2',
        'torneos',
        'torneo_jugadores'
      )
    ORDER BY tablename
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', r.tablename);
    dropped := dropped || r.tablename || ', ';
  END LOOP;

  IF dropped = '' THEN
    RAISE NOTICE 'No unused tables found. All tables are in use.';
  ELSE
    RAISE NOTICE 'Dropped unused tables: %', dropped;
  END IF;
END $$;

COMMIT;
