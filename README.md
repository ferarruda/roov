<<<<<<< HEAD
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
=======
# ROOV — Front-end

Front-end web do ROOV, construído sobre o `ROOV Product & Engineering Documentation`
e o design system do Figma (`Design ROOV Mobile App`).

**Stack:** React 18 + JavaScript + Vite 6 + Tailwind CSS 4 + React Router 6.

```bash
npm install
npm run dev      # http://localhost:5173
```

## Como o código está organizado

A estrutura espelha a arquitetura em camadas do Cap. 26 e a divisão em
Camada 1 (componentes globais) / Camada 2 (módulos funcionais) da Parte III.

```
src/
├── domain/          Modelo de domínio (Parte V) e taxonomia oficial de tags
│   ├── types.js         typedefs JSDoc — contrato entre serviços e UI
│   └── taxonomy.js      categorias, tipos, ambiente, vibe, público, perfil,
│                        biblioteca, ordenação e o estado vazio dos filtros
│
├── engine/          Business Layer — os motores inteligentes (Parte VI)
│   ├── weights.js       Sistema Oficial de Pesos (Cap. 66)
│   ├── dna.js           DNA do Local e do Usuário, afinidade (Cap. 57, 58)
│   ├── moment.js        DNA do Momento (Cap. 59) + horário de funcionamento
│   ├── recommendation.js Motor de Recomendação, Explorar, Feed, Comunidades,
│   │                    filtros (Cap. 56, 60–63, 10)
│   └── agenda.js        Algoritmo da Agenda (Cap. 64)
│
├── services/        Repositórios — hoje mock, amanhã REST/Supabase
│   ├── index.js         placesService, postsService, usersService,
│   │                    libraryService, communitiesService, searchService
│   └── mock/            dados de São Paulo no formato do domínio
│
├── state/           Application Layer — orquestra motores e serviços
│   └── RoovProvider.jsx único contexto consumido pelos módulos
│
├── components/      CAMADA 1 — componentes funcionais globais
│   ├── PlaceCard.jsx    ROOV Place Card (Cap. 13) — preview/compacto/
│   │                    expandido/completo
│   ├── DnaStrip.jsx     exibição do DNA ROOV (Cap. 12)
│   ├── FilterSystem.jsx Sistema Oficial de Filtros (Cap. 10)
│   ├── SearchBar.jsx    gatilho da pesquisa unificada (Cap. 9)
│   ├── PlaceActions.jsx as 5 ações do Fluxo de Organização (Cap. 5.4)
│   ├── PostCard.jsx     card de experiência do feed
│   ├── AppShell.jsx     navegação oficial (Cap. 8)
│   └── ui/primitives.jsx design system
│
└── modules/         CAMADA 2 — módulos funcionais
    ├── discovery/       Mapa + Feed + Explorar (Cap. 18, 19, 20)
    ├── place/           ficha do lugar
    ├── communities/     lista e detalhe (Cap. 21)
    ├── saved/           Biblioteca + Agenda (Cap. 22)
    ├── profile/         perfil e gamificação (Cap. 23)
    ├── search/          pesquisa unificada (Cap. 9)
    ├── create/          criar experiência (Cap. 5.5, 11)
    └── onboarding/      splash
```

## Regras estruturais implementadas em código

As dez regras do Cap. 7 não são comentário: são comportamento.

| Regra | Onde vive |
| --- | --- |
| 01 · Toda descoberta começa pela experiência | `experienceTitle()` aparece antes do nome do lugar em todo card de recomendação |
| 02 · Todo post pertence a um lugar | `postsService.create()` lança erro sem `placeId`; o fluxo de criação começa pela escolha do local |
| 03 · Todo local possui um DNA | `consolidateDna()` roda para todo lugar no boot |
| 04 · Todo DNA é construído pela comunidade | `buildPlaceDna()` deriva das tags dos posts; sementes de curadoria perdem peso conforme a comunidade posta |
| 05 · Toda recomendação considera contexto | `scorePlace()` pondera DNA do Momento em 28% |
| 06 · Todo local usa o ROOV Place Card | nenhum módulo desenha card de lugar próprio |
| 07 · Todo módulo usa o Sistema Oficial de Filtros | `filters` vive no estado global e vale em Mapa, Feed, Explorar e Biblioteca |
| 08 · Toda experiência pode ser salva | `LibraryActionRow` está em todas as variantes do Place Card |
| 09 · Toda experiência pode ser planejada | `PlanActionRow` → sheet de agenda |
| 10 · Toda interação melhora o algoritmo | publicar um post reconsolida o DNA do lugar na hora; salvar reconstrói o DNA do usuário |

E as proibições do Cap. 12: nenhuma tela exibe estrela, nota ou porcentagem.
A força de uma tag do DNA é comunicada só por ordem e opacidade.

## Estado atual

- Dados vêm de `services/mock/` com latência simulada de 180 ms.
- O mapa é uma projeção equirretangular sobre um grid, sem tile server.
  Para trocar por MapLibre/Google Maps basta substituir `project()` e o
  `<div>` de fundo em `modules/discovery/MapView.jsx` — pins, preview e
  filtros continuam iguais.
- Clima é simulado em `engine/moment.js` (`inferCondition`). O ponto de
  integração real está isolado nessa função.
- Sem autenticação: `CURRENT_USER_ID` é fixo.

## Portabilidade para React Native / Expo

`domain/`, `engine/` e `services/` são JavaScript puro, sem uma única
referência a DOM, `window` ou CSS. Essas três pastas rodam sem alteração
dentro de um app Expo. O que precisa ser reescrito em componentes nativos é
`components/` e `modules/`.
>>>>>>> 2c406aa3baad1a2c43886edf827425f2023a78a4
