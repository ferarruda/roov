# ROOV

Plataforma de descoberta de experiências. Monorepo com o frontend web, a API e
o pacote compartilhado de domínio e motores.

```
roov/
├── apps/
│   ├── web/          Frontend React + Vite (existente, inalterado)
│   └── api/          API NestJS + Prisma + PostgreSQL
└── packages/
    └── core/         Domínio e motores — implementação única, dois consumidores
```

## Por que monorepo

O `engine/` é o produto: DNA, pesos e recomendação. Nas Fases 6 e 7 ele precisa
rodar no servidor. Sem um pacote compartilhado, existiriam duas implementações
do mesmo algoritmo divergindo em silêncio — o tipo de defeito que não gera erro,
só recomendação ruim.

`packages/core` é a implementação única. Ele é puro: sem framework, sem I/O, sem
DOM. Escrito em TypeScript e publicado como JavaScript com `.d.ts`, de modo que
o frontend continua em JavaScript e ainda ganha autocomplete.

## Requisitos

- Node.js 22+
- pnpm 9+ (`corepack enable`)
- Docker

## Primeira execução

```bash
corepack enable
pnpm install

cd apps/api
docker compose up -d              # Postgres com PostGIS
cp .env.example .env
openssl rand -base64 48           # cole o resultado em JWT_SECRET
pnpm db:migrate                   # aplica as migrations
cd ../..

pnpm dev:api                      # http://localhost:3000/v1/health
pnpm dev:web                      # http://localhost:5173
```

Nenhum serviço externo é necessário para desenvolver. A autenticação é nossa e
o banco roda em container.

## Comandos

| Comando | O que faz |
| --- | --- |
| `pnpm dev:api` | API em modo watch |
| `pnpm dev:web` | Frontend em modo watch |
| `pnpm test` | Testes de todos os pacotes |
| `pnpm build` | Build de todos os pacotes |
| `pnpm db:migrate` | Cria e aplica migration em desenvolvimento |
| `pnpm db:studio` | Interface visual do banco |

## Rotas

Todas ficam sob `/v1`. Por padrão **toda rota exige autenticação**; as marcadas
como públicas são exceções explícitas via `@Public()`.

| Método | Rota | Público | O que faz |
| --- | --- | --- | --- |
| `GET` | `/health` | sim | Estado da API e do banco |
| `POST` | `/auth/register` | sim | Cadastro. Devolve sessão |
| `POST` | `/auth/login` | sim | Login. Devolve sessão |
| `POST` | `/auth/refresh` | sim | Renova a sessão, rotacionando o refresh token |
| `POST` | `/auth/logout` | sim | Revoga a sessão apresentada |
| `GET` | `/auth/me` | **não** | Perfil do usuário autenticado |

Rotas de sessão são públicas porque são chamadas justamente quando não há
access token válido — exigir um aqui tornaria login e renovação impossíveis.

**Sessão devolvida por register, login e refresh:**

```json
{
  "accessToken": "eyJhbGciOi…",
  "refreshToken": "3Yk8_…",
  "user": { "id": "…", "email": "…", "username": "…", "role": "usuario" }
}
```

O access token vale 15 minutos e não é revogável. O refresh token vale 30 dias,
fica no banco (como hash) e é revogável — é ele que faz o logout ter efeito real.

## Contrato da API

Todas as rotas ficam sob `/v1`.

**Sucesso**

```json
{
  "data": { "status": "ok" },
  "meta": { "requestId": "9f2c…" }
}
```

**Erro**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Lugar não encontrado.",
    "details": [],
    "requestId": "9f2c…"
  }
}
```

`code` é estável e legível por máquina — decisões do cliente se baseiam nele.
`message` é para humanos e pode mudar a qualquer momento, inclusive de idioma.
Nenhum cliente deve comparar `message`.

**Paginação:** por cursor, nunca por offset. O cursor é opaco: não deve ser
interpretado nem construído no frontend.

```json
{ "data": [], "meta": { "nextCursor": "eyJ2…", "hasMore": true } }
```

## Invariantes da arquitetura

Regras que valem para toda a evolução do projeto. Quebrar qualquer uma delas
exige decisão registrada em documento, não commit.

1. **`packages/core` é puro.** Sem Nest, sem Prisma, sem React, sem rede, sem
   disco. Tempo entra por parâmetro, nunca por `Date.now()` interno — motor que
   lê o relógio sozinho não é testável de forma determinística.
2. **Só repositórios tocam o Prisma.** Controllers e services nunca importam
   `PrismaService`.
3. **Nenhum provedor externo participa da autenticação.** Identidade é nossa:
   nossa tabela, nosso hash, nosso token. Serviços externos entram só onde
   agregam valor claro, como Storage.
4. **Rota nasce protegida.** O guard é global; abrir exige `@Public()`
   explícito. Esquecer o decorator devolve 401 — falha fechada, não aberta.
5. **Senha nunca sai da camada de auth.** Nem em resposta, nem em log, nem em
   mensagem de erro. A projeção pública do usuário é uma lista explícita de
   campos, para que um campo sensível novo fique de fora por padrão.
6. **Todo erro sai como `AppException`.** Nunca `HttpException` crua, nunca
   `throw new Error` numa rota.

## Documentos

- `docs/VISION.md` — identidade do produto
- `docs/ARCHITECTURE.md` — arquitetura do frontend
- `docs/ROADMAP.md` — ordem oficial de desenvolvimento
- `docs/FASE-1-DECISOES-TECNICAS.md` — decisões técnicas do backend
- `docs/EMENDA-001-AUTENTICACAO-E-CUSTOS.md` — custos e hospedagem
- `docs/EMENDA-002-AUTENTICACAO-PROPRIA.md` — reversão para autenticação própria
