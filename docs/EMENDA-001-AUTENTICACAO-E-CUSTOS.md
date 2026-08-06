# Emenda 001 — Autenticação e Otimização de Custos

**Status:** aprovado
**Altera:** `FASE-1-DECISOES-TECNICAS.md`, decisões D5, D9 e escopo da Fase 1
**Motivo:** decisão do fundador de priorizar velocidade de validação e custo zero

---

## 1. D5 revisada — Supabase Auth

**Decisão anterior:** autenticação própria.
**Decisão vigente:** **Supabase Auth.**

Registro que a decisão é boa e que meu voto anterior superestimou o risco. Ao
revisar o cenário com o dado que importa: no Supabase, o GoTrue guarda os
usuários no schema `auth` **do nosso próprio Postgres**, com senhas em bcrypt.
Isso é qualitativamente diferente de um provedor externo tipo Auth0 ou Clerk, de
onde não se extrai hash de senha. Aqui, uma migração futura para auth própria é
um `INSERT ... SELECT` a partir de uma tabela que já é nossa.

O risco de lock-in que eu havia classificado como alto é, na prática, **médio-baixo**.
Você acertou.

### O que ganhamos

- Verificação de e-mail, recuperação de senha e OAuth social prontos
- Aproximadamente uma semana de desenvolvimento economizada
- Um fornecedor de e-mail transacional a menos (~US$ 0 em vez de ~US$ 20/mês)
- A Fase 2 encolhe drasticamente

### O acoplamento real que isso cria

Não é a autenticação: **é o banco.** Como o GoTrue vive dentro do Postgres do
Supabase, escolher Supabase Auth também fixa o Supabase como host do banco. O
plano B de migrar para Neon (D3) sai da mesa enquanto usarmos Supabase Auth.

Isso é aceitável — Supabase é Postgres gerenciado, não um banco proprietário —
mas precisa estar escrito, não descoberto depois.

### Três regras que tornam a decisão reversível

Estas regras são o que separa "usar Supabase Auth" de "ficar preso ao Supabase".
São **invariantes de arquitetura**, não sugestões:

1. **Tabela `users` própria, com chave primária UUID nossa.** O `id` do Supabase
   entra como coluna `supabase_user_id`, única e indexada. Nenhuma outra tabela
   do sistema referencia o id do Supabase — todas apontam para o nosso `users.id`.
   Se um dia trocarmos de provedor, muda uma coluna, não o schema inteiro.

2. **Nada de RLS como camada de autorização.** Toda decisão de permissão vive na
   API, em guards do Nest. RLS é excelente e é exatamente o tipo de coisa que não
   se leva embora: regra de negócio escrita em política de Postgres específica do
   Supabase não migra.

3. **O frontend nunca fala com o Supabase para dados.** Só para login. Todo o
   resto passa pela nossa API. O SDK do Supabase não entra nos módulos.

### Como funciona na prática

```
Frontend  ──login/signup──▶  Supabase Auth  ──▶  devolve JWT
Frontend  ──requisições──▶  API ROOV (Bearer JWT)
API ROOV  ──valida assinatura via JWKS──▶  resolve users.id  ──▶  autoriza
```

A API **valida** o token, não o emite. Autorização (papéis `moderador`, `admin`,
`business`) é 100% nossa, num guard próprio.

### Impacto no roadmap

A Fase 2 deixa de ser "construir autenticação" e passa a ser **"integrar
autenticação"**: guard de JWT, provisionamento do usuário local no primeiro
acesso, decorator `@CurrentUser()` e guard de papéis. É trabalho de dias, não de
semanas. Fases 2 e 3 provavelmente se fundem.

---

## 2. D9 revisada — custo zero durante todo o desenvolvimento

Verifiquei os preços atuais em vez de confiar na memória, e o cenário mudou
desde o que eu tinha em mente.

**O que mudou:** <cite index="16-1">a Fly.io removeu as cotas gratuitas para novas contas em 2024; hoje novos cadastros recebem apenas um teste limitado e, depois, é preciso cartão de crédito</cite>. Ou seja, a Fly deixou de ser opção de custo zero.

**Render permanece com plano gratuito real**, com uma ressalva conhecida:
<cite index="8-1">serviços web gratuitos hibernam após 15 minutos sem tráfego e levam cerca de um minuto para voltar ao receber a próxima requisição</cite>. <cite index="9-1">O Postgres gratuito da Render, por outro lado, é apagado após 30 dias</cite> — irrelevante para nós, porque o banco é do Supabase.

### Decisão

| Momento | Hospedagem da API | Custo |
| --- | --- | --- |
| Fases 1 a 11 (sem usuários reais) | Render Free | **US$ 0** |
| Lançamento | Render Starter (~US$ 7) ou Fly.io (~US$ 2–5) | ~US$ 5 |

Durante o desenvolvimento, hibernar não custa nada: quem espera 40 segundos
somos nós. Trocar isso por US$ 0/mês é o negócio certo agora.

**Custo total do projeto até o lançamento: US$ 0/mês.**

| Item | Plano | Custo |
| --- | --- | --- |
| Postgres + Auth + Storage | Supabase Free | US$ 0 |
| API | Render Free | US$ 0 |
| Frontend | Vercel Hobby | US$ 0 |
| E-mail | incluso no Supabase Auth | US$ 0 |

### A garantia contra bloqueio técnico

Você pediu serviços gratuitos que não criem bloqueio difícil de remover. A
proteção é uma linha só: **a API é publicada como container Docker**. Um
`Dockerfile` roda igual em Render, Fly, Railway, Koyeb ou num VPS de US$ 4. Trocar
de hospedagem vira uma tarde de trabalho, não uma migração. Por isso o
`Dockerfile` entra já na Fase 1, mesmo sem deploy configurado.

**Alertas operacionais registrados:** o plano gratuito do Supabase pausa o
projeto após ~7 dias sem atividade, e preços de plano gratuito mudam com
frequência — os números acima valem para agosto de 2026 e devem ser reconferidos
antes do lançamento.

---

## 3. Contrato de API — versão 1 aprovada

O contrato do D7 (envelope, códigos de erro, paginação por cursor) fica valendo
como versão 1, ajustável até o início da Fase 4. A partir da Fase 4 ele congela:
o frontend passará a depender dele.

---

## 4. Mudança no ambiente de desenvolvimento local

Consequência direta da adoção do Supabase Auth: **o `docker-compose.yml` com
Postgres puro sai do escopo e entra o Supabase CLI.**

Motivo: com auth do Supabase, um Postgres nu localmente não serve — falta o
schema `auth`. O Supabase CLI sobe localmente, via Docker, o mesmo conjunto que
roda em produção (Postgres + GoTrue + Storage). Menos configuração nossa e
paridade real entre ambientes.

`docker compose up` é substituído por `supabase start`.
