-- Backup LigaFC - 2026-07-18
-- Exported from Supabase SQL Editor

-- ─── jugadores ──────────────────────────────────────────────────────────────
INSERT INTO "public"."jugadores" ("id", "nombre", "created_at") VALUES
('149ef76f-1dd8-496f-97f0-457a6ab0b6d0', 'Guille', '2026-07-11 23:16:41.882438+00'),
('8dbb65cd-e088-4a29-9a6f-a609ffaf9fd3', 'Checho', '2026-07-11 23:16:41.882438+00'),
('b31e4979-6aef-411c-a5f3-e132371e67fd', 'Mambo', '2026-07-11 23:16:41.882438+00'),
('fddb66af-a39f-4899-aa25-9c600a567115', 'Seba', '2026-07-11 23:16:41.882438+00');

-- ─── equipos ────────────────────────────────────────────────────────────────
INSERT INTO "public"."equipos" ("id", "nombre", "slug", "logo_url", "created_at") VALUES
('0b3de405-c8ca-40a0-bdda-cea0c7437d98', 'Bayer 04 Leverkusen', 'bayer-leverkusen', '/logos/bayer-leverkusen.svg', '2026-07-11 23:16:41.882438+00'),
('21de8d09-8252-445c-a0ca-dc232409a986', 'Tottenham Hotspur', 'tottenham', '/logos/tottenham.svg', '2026-07-11 23:16:41.882438+00'),
('2300e836-8629-484b-b15a-267a28fc415c', 'Manchester United', 'man-united', '/logos/man-united.svg', '2026-07-11 23:16:41.882438+00'),
('2b57e19a-bcf7-4ea6-b4ce-f64a860f29fa', 'FC Barcelona', 'barcelona', '/logos/barcelona.svg', '2026-07-11 23:16:41.882438+00'),
('3b2fb8e4-48dc-4590-aa99-9f7b4a82a514', 'Atlético de Madrid', 'atletico-madrid', '/logos/atletico-madrid.svg', '2026-07-11 23:16:41.882438+00'),
('3cc79886-2cfb-44c5-92d0-c1b7fb0dc1e7', 'Inter de Milán', 'inter-milan', '/logos/inter-milan.svg', '2026-07-11 23:16:41.882438+00'),
('43c43c63-ee9b-481b-bf74-5b99d94a5ec2', 'Paris Saint-Germain', 'psg', '/logos/psg.svg', '2026-07-11 23:16:41.882438+00'),
('4afb0410-aada-49be-96d1-de72724d7b9e', 'Liverpool FC', 'liverpool', '/logos/liverpool.svg', '2026-07-11 23:16:41.882438+00'),
('67202658-f955-422d-abf2-999128ea3344', 'AC Milan', 'ac-milan', '/logos/ac-milan.svg', '2026-07-11 23:16:41.882438+00'),
('96ad9840-071f-48fd-89ba-910c8008fb3e', 'Chelsea FC', 'chelsea', '/logos/chelsea.svg', '2026-07-11 23:16:41.882438+00'),
('a366a65a-ba7e-49f5-84f5-68abadbc6b4b', 'FC Bayern München', 'bayern-munich', '/logos/bayern-munich.svg', '2026-07-11 23:16:41.882438+00'),
('ae655cc9-6568-4a6d-a9f3-1b006fcdaf6b', 'Juventus FC', 'juventus', '/logos/juventus.svg', '2026-07-11 23:16:41.882438+00'),
('b4e5b1f1-1ec6-4f5f-a15c-86cde632761f', 'Arsenal FC', 'arsenal', '/logos/arsenal.svg', '2026-07-11 23:16:41.882438+00'),
('c33959fd-2ca2-4a51-ad42-a98e902b3075', 'Manchester City', 'man-city', '/logos/man-city.svg', '2026-07-11 23:16:41.882438+00'),
('cf13df67-3af5-450b-8fdb-20a48b166641', 'Borussia Dortmund', 'borussia-dortmund', '/logos/borussia-dortmund.svg', '2026-07-11 23:16:41.882438+00'),
('db2af66f-8fd5-4c05-b366-009d701e854c', 'Real Madrid', 'real-madrid', '/logos/real-madrid.svg', '2026-07-11 23:16:41.882438+00');

-- ─── partidos (sin columnas jugador_1_id/jugador_2_id — pre-refactor) ──────
-- Nota: equipo_1_id/equipo_2_id mezclan slugs antiguos ('psg') con UUIDs nuevos
