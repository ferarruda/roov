# Imagem da API do ROOV.
#
# Existe desde a Fase 1, antes de haver deploy configurado, e o motivo é
# estratégico: um container roda igual em Render, Fly, Railway, Koyeb ou num
# VPS. É o que garante que usar plano gratuito hoje não vire bloqueio amanhã —
# trocar de hospedagem passa a ser uma tarde de trabalho, não uma migração.
#
# Build a partir da RAIZ do monorepo:
#   docker build -f apps/api/Dockerfile -t roov-api .

# ─── Estágio 1: dependências ──────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /repo

# Só os manifestos primeiro: o cache de camada do Docker sobrevive a mudanças
# de código-fonte, e `pnpm install` deixa de rodar a cada commit.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json ./packages/core/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# ─── Estágio 2: build ─────────────────────────────────────────────────────────
FROM deps AS build
WORKDIR /repo
COPY . .

RUN pnpm --filter @roov/core build \
 && pnpm --filter @roov/api exec prisma generate \
 && pnpm --filter @roov/api build \
 && pnpm prune --prod

# ─── Estágio 3: runtime ───────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
RUN corepack enable
WORKDIR /repo

ENV NODE_ENV=production

# Usuário sem privilégio. Processo como root dentro de container transforma
# uma falha de execução remota em comprometimento do host.
USER node

COPY --from=build --chown=node:node /repo/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/packages/core/dist ./packages/core/dist
COPY --from=build --chown=node:node /repo/packages/core/package.json ./packages/core/
COPY --from=build --chown=node:node /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=node:node /repo/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=node:node /repo/apps/api/package.json ./apps/api/

WORKDIR /repo/apps/api
EXPOSE 3000

# Migrations rodam no start, não no build: no build não existe banco acessível.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
