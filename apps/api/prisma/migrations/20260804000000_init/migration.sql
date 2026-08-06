-- Migration inicial: extensões do banco.
--
-- postgis
--   O ROOV é um produto geoespacial: "lugares perto de mim" será a consulta
--   mais frequente do sistema. Calcular Haversine em memória funciona com 50
--   lugares e colapsa com 5.000. PostGIS permite índice espacial GiST e
--   consulta por raio dentro do próprio banco.
--
-- pg_trgm
--   Busca por similaridade de texto. A pesquisa da Fase 10 precisa tolerar erro
--   de digitação e acento — "padaria" deve encontrar "Padária". LIKE '%termo%'
--   não usa índice e degrada rápido.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
