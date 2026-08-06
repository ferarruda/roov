# ROOV — Decisões Técnicas da Fase 1 (Foundation)

> Documento de decisão arquitetural. Nenhuma linha de código da Fase 1 deve ser
> escrita antes da aprovação deste documento. Uma vez aprovado, ele passa a ser
> fonte de verdade e só muda por nova decisão registrada.

**Autor:** CTO / Backend Principal
**Status:** aguardando aprovação
**Escopo:** Fase 1 do `ROADMAP.md` — Foundation

---

## 1. Contexto e fontes de verdade

Documentos disponíveis: `VISION.md`, `ARCHITECTURE.md`, `ROADMAP.md` e o código
do frontend (`roov-main`).

**Lacuna registrada.** O `README.md` do frontend referencia um documento maior —
*"ROOV Product & Engineering Documentation"*, capítulos 5 a 71 — que não foi
disponibilizado. Ele contém, entre outras coisas, o **Cap. 28 (API REST)** e o
**Cap. 66 (Sistema Oficial de Pesos)**. Consequência prática:

- Para **regras de algoritmo** (DNA, pesos, recomendação), a fonte de verdade
  passa a ser o **código de `src/engine/`**, que já implementa esses capítulos.
  Isso é aceitável porque o código é explícito e comentado.
- Para o **contrato da API**, não existe fonte prévia. Ele será **projetado do
  zero neste documento** a partir das necessidades reais dos módulos do
  frontend. Se o Cap. 28 aparecer depois e divergir, haverá retrabalho.

**Recomendação:** se o Cap. 28 existir em algum lugar, ele deve entrar antes da
Fase 4. Até a Fase 3 o risco de divergência é baixo.

---

## 2. Restrições que moldam todas as decisões

| Restrição | Impacto |
| --- | --- |
| Investimento baixo | Custo mensal precisa começar perto de zero e crescer só com uso real |
| Equipe pequena | Toda complexidade adicionada é paga em velocidade; abstração só onde há retorno claro |
| Frontend pronto e em JavaScript | O backend não pode exigir reescrita do frontend |
| Produto de vários anos | Decisões de identidade e dados não podem gerar lock-in caro |
| Escopo travado no MVP 1 | Nada fora dos 7 módulos entra agora |

O princípio do `VISION.md` — *"simplicidade antes de complexidade"* — vale para
arquitetura, não só para produto. Este documento aplica isso literalmente:
recuso deliberadamente algumas abstrações populares mais adiante, com
justificativa.

---

## 3. Decisões

### D1 — NestJS + TypeScript

**Alternativas consideradas**

| Opção | Prós | Contras |
| --- | --- | --- |
| **NestJS** | Modularidade nativa (espelha o `ARCHITECTURE.md`), injeção de dependência, guards/interceptors/pipes que atendem exatamente as Fases 1, 2 e 12, ecossistema maduro, testes de primeira classe | Verboso, curva de aprendizado, mais boilerplate |
| Fastify puro | Mais leve e rápido, menos cerimônia | Arquitetura precisa ser inventada e disciplinada à mão — a primeira coisa que degrada em projeto solo |
| Supabase puro (sem backend) | Custo quase zero, entrega rápida | O motor de recomendação não cabe em RLS + Edge Functions; o produto **é** o algoritmo. Lock-in total |

**Decisão: NestJS.** Já é o que o `ROADMAP.md` prevê, e a escolha se sustenta
tecnicamente: as entregas da Fase 1 (exceptions globais, padronização de
resposta, validação) são recursos de primeira classe do Nest, não código nosso.

**TypeScript é obrigatório** — Nest é TS-native. Isso responde parcialmente a
minha pergunta anterior sobre tipagem: **o backend nasce tipado**. Ver D2 para o
que acontece com o frontend.

**Consequências:** mais arquivos por funcionalidade. Aceito — previsibilidade
vale mais que concisão em projeto de anos.

---

### D2 — Monorepo com pacote `core` compartilhado

Esta é **a decisão mais importante deste documento.**

**O problema.** O `engine/` do frontend (DNA, pesos, recomendação, momento,
agenda) é o produto. Nas Fases 6 e 7 ele precisa rodar no servidor. Existem três
caminhos:

| Opção | Prós | Contras |
| --- | --- | --- |
| Reimplementar no backend | Nenhuma mudança no frontend agora | **Duas implementações do mesmo algoritmo divergindo em silêncio.** Risco fatal para o produto |
| Copiar os arquivos | Rápido | Mesma divergência, só que disfarçada |
| **Monorepo com `packages/core`** | Uma implementação, um teste, dois consumidores | Setup inicial, ferramenta a mais (pnpm workspaces) |

**Decisão: monorepo com pnpm workspaces.**

```
roov/
├── apps/
│   ├── web/          frontend atual, movido sem alteração
│   └── api/          backend NestJS (novo)
├── packages/
│   └── core/         domain/ + engine/ — TypeScript, zero dependências
└── package.json
```

**Por que agora e não depois:** montar monorepo hoje custa algumas horas.
Montar depois, com backend e frontend já enraizados, custa dias e gera conflito.
É a definição de decisão que deve ser tomada cedo.

**Sobre migrar o frontend para TypeScript:** **não migramos agora.** Fora do
escopo do MVP 1 e sem retorno imediato. O que fazemos é diferente: `packages/core`
é escrito em TS e **publicado com JavaScript compilado + arquivos `.d.ts`**. O
frontend continua JS e consome normalmente; o backend consome tipado. O
frontend ganha autocomplete sem migração. Quando quiser migrar, o caminho já
está aberto.

**Movimento em duas etapas:**
1. **Fase 1:** cria a estrutura, move o frontend para `apps/web` sem tocar no
   código dele, cria `packages/core` **vazio**.
2. **Fase 6:** move `domain/` e `engine/` para `packages/core`, converte para TS,
   escreve os testes de regressão. Só então o backend passa a usá-los.

Assim as Fases 1 a 5 não pagam nenhum custo por essa decisão.

**Risco:** o frontend precisa continuar rodando após a mudança de pasta. Mitigação:
validar `npm run dev` e `npm run build` como parte da entrega da Fase 1.

---

### D3 — PostgreSQL gerenciado no Supabase + PostGIS

**Decisão:** Supabase como **banco gerenciado e storage**, não como plataforma.
Ou seja: usamos o Postgres e o Storage; **não** usamos RLS como camada de
autorização nem Edge Functions. Toda regra de negócio vive na nossa API.

**Por quê:** o `ROADMAP.md` já prevê Supabase Storage na Fase 11 — usar o mesmo
fornecedor para banco evita um vendor a mais. O plano gratuito cobre a fase
inicial, e é Postgres puro: sair dele é um `pg_dump`, sem lock-in real.

**Alternativa considerada:** Neon (melhor DX, branching de banco). Guardada como
plano B — a troca custa horas, não semanas.

**PostGIS habilitado desde a primeira migration.** O produto é geoespacial:
"lugares perto de mim" é a consulta mais frequente do sistema. Fazer isso com
Haversine em memória funciona com 50 lugares e morre com 5.000. Habilitar a
extensão depois exige migrar dados; habilitar agora é uma linha.

**Alerta operacional:** o plano gratuito do Supabase **pausa o projeto após ~7
dias sem atividade**. Irritante em desenvolvimento, inaceitável em produção.
Quando houver usuários reais, o upgrade (~US$ 25/mês) deixa de ser opcional.

---

### D4 — Prisma como ORM, com exceção explícita para geo

**Decisão:** Prisma, como o roadmap prevê. Migrations versionadas, tipos gerados
a partir do schema, sem escrita manual de SQL para CRUD.

**Limitação que precisa ser dita agora:** o Prisma **não suporta tipos PostGIS
nativamente**. Consultas geoespaciais serão feitas com `$queryRaw` tipado,
isoladas em um único repositório (`PlacesGeoRepository`). Não é gambiarra: é
uma fronteira consciente e contida. Se ela vazar para vários arquivos, virou
problema — por isso fica isolada desde o início.

---

### D5 — Autenticação própria (não Supabase Auth)

Decisão de Fase 2, registrada aqui porque **muda o modelo de dados da Fase 1**.

| Opção | Prós | Contras |
| --- | --- | --- |
| **Auth próprio** (Nest + argon2 + refresh rotation) | Zero lock-in na identidade, controle total, `users` é nossa tabela | ~1 semana de trabalho, superfície de segurança que precisa ser feita certo, exige provedor de e-mail |
| Supabase Auth | Grátis até 50k MAU, e-mail de verificação e reset prontos, OAuth social de graça, economiza ~1 semana | Identidade fora do nosso banco, lock-in no ativo mais caro de migrar, senhas que não são nossas |

**Recomendação: auth próprio.** No ROOV, identidade não é acessório — todo o
DNA do Usuário, os sinais comportamentais e o grafo social penduram nela.
Lock-in de identidade é o mais caro que existe: migrar senhas de outro provedor
é doloroso ou impossível. Uma semana hoje compra liberdade permanente.

**Contraponto honesto:** se o objetivo for validar o produto o mais rápido
possível e você aceitar o risco, Supabase Auth é uma escolha legítima e
defensável. Preciso da sua decisão — ela é reversível, mas com custo.

**Ou seja, decisão sua.** Meu voto é auth próprio; a estrutura da Fase 1
funciona nos dois casos.

---

### D6 — Camadas dentro de cada módulo: pragmatismo, não Clean Architecture completa

**Decisão consciente: não implementamos ports/adapters em todos os módulos.**

Clean Architecture completa (entidades, casos de uso, gateways, DTOs de
fronteira) numa equipe pequena produz cinco arquivos para salvar um usuário.
Isso viola "simplicidade antes de complexidade".

Estrutura adotada por módulo:

```
modules/places/
├── places.module.ts
├── places.controller.ts      HTTP: entrada, saída, status
├── places.service.ts         orquestração e regra de aplicação
├── places.repository.ts      acesso a dados (Prisma) — única camada que toca o banco
└── dto/                      validação de entrada e forma de saída
```

**O que preservamos da Clean Architecture, e isso não é negociável:** a
inteligência do produto (`packages/core`) permanece **pura** — sem Nest, sem
Prisma, sem HTTP, sem I/O. Funções que recebem dados e devolvem dados. É a regra
que o `ARCHITECTURE.md` já estabelece para o `engine`, e é a que realmente
importa: ela mantém o algoritmo testável, portável e independente de framework.

Casos de uso explícitos entram **só** onde a complexidade justificar — a
consolidação de DNA da Fase 6 é o primeiro candidato provável.

---

### D7 — Contrato da API

**REST versionado:** todas as rotas sob `/v1`. Versionar depois é caro;
versionar agora é grátis.

**Envelope de resposta padronizado** (entrega da Fase 1). Sucesso:

```json
{ "data": { }, "meta": { } }
```

Erro:

```json
{
  "error": {
    "code": "PLACE_NOT_FOUND",
    "message": "Lugar não encontrado.",
    "details": []
  }
}
```

`code` é estável e legível por máquina; `message` é para humanos e pode mudar de
idioma. O frontend nunca deve tomar decisão com base em `message`.

**Paginação por cursor (keyset), não por offset.** Offset degrada em listas
grandes e duplica itens quando o conteúdo muda entre páginas — exatamente o
comportamento de um feed. Formato:

```json
{ "data": [ ], "meta": { "nextCursor": "opaco", "hasMore": true } }
```

**Ponto delicado registrado agora:** feed e recomendações são **ordenados por
score calculado**, não por coluna do banco. Cursor keyset puro não funciona
sobre score volátil. A solução (Fase 7) será um cursor que carrega a semente de
ranking da sessão. Não resolvemos isso agora, mas o formato de cursor opaco já
deixa espaço para isso sem quebrar o contrato — que é o objetivo de decidir cedo.

---

### D8 — Testes

**Decisão:** Jest, em duas camadas.

- **Unitários** para `packages/core` — funções puras, rápidas, sem I/O. É onde
  mora o valor real: um teste de golden file sobre o ranking impede que um ajuste
  de peso mude silenciosamente as recomendações de todo mundo.
- **Integração** para os módulos da API, contra **Postgres real** em Docker, não
  mock de Prisma. Mock de ORM testa o mock, não o sistema.

Na Fase 1 entregamos a **estrutura e o pipeline**, com testes reais cobrindo o
que existir (health check, filtro de exceção, validação). Cobertura nasce junto
com cada fase, nunca depois.

---

### D9 — Hospedagem e custo real

| Item | Início | Quando houver usuários |
| --- | --- | --- |
| Postgres + Storage (Supabase) | Grátis | ~US$ 25/mês |
| API (Railway ou Render) | ~US$ 5/mês | ~US$ 20/mês |
| Frontend (Vercel/Netlify) | Grátis | Grátis |
| E-mail transacional (Resend) | Grátis (3k/mês) | ~US$ 20/mês |
| **Total** | **~US$ 5/mês** | **~US$ 65/mês** |

**Evitar planos gratuitos que hibernam para a API.** Cold start de 30 segundos
destrói a percepção de qualidade do app. Os ~US$ 5/mês do Railway são o gasto
com melhor retorno do projeto inteiro.

---

## 4. Riscos identificados

| # | Risco | Severidade | Mitigação |
| --- | --- | --- | --- |
| R1 | Cap. 28 aparecer depois e divergir do contrato desenhado aqui | Média | Contrato simples e versionado; revisar antes da Fase 4 |
| R2 | Engine duplicado entre front e back | **Alta** | D2 — `packages/core` como implementação única |
| R3 | Mudança de peso alterar ranking sem ninguém perceber | **Alta** | D8 — golden files sobre o ranking, antes da Fase 6 |
| R4 | LGPD: exclusão de usuário cujos posts já formaram o DNA de lugares | **Alta** | DNA precisa ser **recomputável** a partir dos posts, nunca só mutado. Modelagem da Fase 4/6 deve garantir isso |
| R5 | Supabase free pausar o projeto | Baixa | Conhecido; upgrade antes do lançamento |
| R6 | Prisma + PostGIS | Média | D4 — raw SQL isolado em um repositório |
| R7 | Consultas geoespaciais sem índice | Média | Índice GiST desde a migration inicial |

---

## 5. Dívidas herdadas do frontend (registradas, não corrigidas agora)

Encontradas na análise do código. **Nenhuma será tocada nesta fase** — mudar
frontend durante a fundação do backend é mudar duas coisas ao mesmo tempo.

| # | Problema | Onde | Fase para corrigir |
| --- | --- | --- | --- |
| F1 | `rebuildSeed()` reconstrói sementes a partir do DNA que já as contém → realimentação que reforça a curadoria em vez de diluí-la, contrariando a Regra 04 | `services/index.js` | Fase 6 |
| F2 | `consolidateDna()` é regra de negócio na camada de serviço, violando o `ARCHITECTURE.md` | `services/index.js` | Fase 6 |
| F3 | `list()` e `feed()` não aceitam parâmetro; o cliente carrega o corpus inteiro | `services/index.js` | Fase 4 / 5 |
| F4 | `distanceKm` é atributo da entidade `Place`, mas é projeção de consulta — impede cache compartilhado | `domain/types.js` | Fase 4 |
| F5 | Motores rodam no cliente: expõem os pesos e exigem o dataset completo | `engine/` | Fase 6 / 7 |

---

## 6. Escopo exato da Fase 1

**Entra:**

1. Monorepo pnpm; frontend movido para `apps/web` **sem alteração de código**;
   `packages/core` criado vazio
2. `apps/api` — NestJS + TypeScript, estrutura modular
3. Configuração tipada e validada na inicialização (falha imediata se faltar env)
4. Prisma + PostgreSQL + PostGIS, com migration inicial e migrations versionadas
5. Filtro global de exceções com o formato de erro do D7
6. Interceptor de resposta com o envelope do D7
7. `ValidationPipe` global com whitelist (campo não declarado no DTO é rejeitado)
8. Health check (`/v1/health`) verificando banco
9. Estrutura de testes: unitário + integração com Postgres em Docker
10. Logger estruturado em JSON e correlation id por requisição
11. Docker Compose para desenvolvimento local
12. `README` do backend e atualização do `ARCHITECTURE.md`

**Não entra** (evitar avanço prematuro):

- Qualquer entidade de negócio (`User`, `Place`, `Post`) — Fases 2 a 5
- Autenticação — Fase 2
- Migração do `engine` — Fase 6
- CI/CD e deploy — quando houver o que publicar

**Critério de conclusão:** `docker compose up` sobe API e banco; `/v1/health`
responde no envelope padrão; erro forçado retorna o formato de erro padrão;
`pnpm test` passa; frontend continua rodando em `apps/web`.

---

## 7. Decisões que preciso de você

1. **D5 — autenticação.** Auth próprio (meu voto) ou Supabase Auth?
2. **D2 — monorepo.** Confirma que posso mover o frontend para `apps/web`?
   O código não muda, só o caminho.
3. **Cap. 28.** Ele existe em algum lugar? Se sim, quero antes da Fase 4.

Aprovado o documento, inicio a Fase 1.
