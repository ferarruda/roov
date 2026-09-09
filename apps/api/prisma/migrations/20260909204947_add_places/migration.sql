-- CreateEnum
CREATE TYPE "PlaceCategory" AS ENUM ('entretenimento', 'gastronomia', 'natureza', 'passeios');

-- CreateEnum
CREATE TYPE "PlaceStatus" AS ENUM ('novo', 'ativo', 'arquivado', 'oculto');

-- CreateTable
CREATE TABLE "places" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PlaceCategory" NOT NULL,
    "place_type" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "photos" TEXT[],
    "price_range" INTEGER NOT NULL,
    "hours" JSONB NOT NULL,
    "status" "PlaceStatus" NOT NULL DEFAULT 'novo',
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "places_category_idx" ON "places"("category");

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Índice GiST funcional para consultas geoespaciais futuras (D4/R7 de
-- docs/FASE-1-DECISOES-TECNICAS.md). Criado desde já, mesmo sem nenhuma
-- consulta ainda o usando: é barato agora e caro depois de reindexar uma
-- tabela grande. Prisma não gerencia isto — não há tipo geography no schema,
-- só as colunas latitude/longitude que a expressão abaixo indexa.
CREATE INDEX "places_geo_gist_idx" ON "places"
USING GIST (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326));
