-- Migration 012: Drop old tables after verifying _v2 tables work correctly
-- WARNING: Only run this AFTER confirming all data migrated successfully

BEGIN;

DROP TABLE IF EXISTS partidos_stats CASCADE;
DROP TABLE IF EXISTS partidos CASCADE;
DROP TABLE IF EXISTS jugadores CASCADE;
DROP TABLE IF EXISTS equipos CASCADE;
DROP TABLE IF EXISTS jugador_stats CASCADE;

COMMIT;
