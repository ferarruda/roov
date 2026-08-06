# Emenda 002 — Reversão para Autenticação Própria

**Status:** aprovado e implementado
**Altera:** `EMENDA-001`, seção 1 (que havia adotado Supabase Auth)
**Fase:** 2

---

## Por que a decisão mudou

A Emenda 001 adotou Supabase Auth. O raciocínio era: o valor não estava em
fazer login e hash de senha — isso é trabalho conhecido e de baixo risco —, mas
em **confirmação de e-mail, recuperação de senha e login social**, que davam
cerca de uma semana de trabalho e exigiam um fornecedor de e-mail.

Ao definir o escopo da Fase 2, essas três funcionalidades foram excluídas do
MVP. **O benefício que sustentava a decisão desapareceu; os custos ficaram.**

Somava-se a exigência de manter o backend independente de provedores externos.
Escondê-lo atrás de uma camada de abstração significaria construir indireção
para encapsular um provedor cujas funcionalidades restantes cabem em cerca de
150 linhas — abstração sem substância atrás dela.

O escopo aprovado também continha duas contradições que só apareceram ao
detalhar: "hash de senha" não seria entrega nossa (quem faz é o GoTrue), e
"cadastro" e "login" não seriam endpoints nossos, a menos que a API virasse um
proxy — mais código do que simplesmente implementar autenticação.

## Decisão

**Autenticação própria**, em NestJS, com:

- Argon2id para hash de senha
- JWT HS256 para access token (15 minutos)
- Refresh token opaco, persistido como hash, com rotação (30 dias)

O Supabase sai da autenticação. Permanece como opção para **Storage** na Fase
11, onde agrega valor real.

## Consequências

**Ganhos**

- Zero dependência de provedor na identidade. Não há migração futura a planejar
- O banco deixa de estar preso ao Supabase — Neon volta a ser plano B viável
- Desenvolvimento local não exige serviço externo: `docker compose up` basta
- O desacoplamento exigido deixa de ser camada a construir e passa a ser
  consequência da arquitetura

**Custos**

- Cerca de um dia a mais de implementação
- Confirmação de e-mail, recuperação de senha e login social passam a ser
  trabalho nosso quando entrarem no escopo. Nenhuma delas é MVP
- Responsabilidade de segurança é nossa. Mitigada por escolhas conservadoras e
  testes que cobrem especificamente os comportamentos de segurança

**Custo de reverter:** zero. Nenhuma linha de autenticação havia sido escrita.

## Impacto em decisões anteriores

| Decisão | Situação |
| --- | --- |
| D3 — Supabase como banco gerenciado | **Mantida**, mas sem trava: Neon volta a ser alternativa |
| D5 — autenticação | **Substituída** por esta emenda |
| Invariantes 3, 4 e 5 do README (RLS, SDK, id do Supabase) | **Obsoletas.** Substituídas por invariantes de autenticação própria |
| Ambiente local com Supabase CLI | **Substituído** por `docker-compose.yml` com Postgres + PostGIS |

## Decisões técnicas registradas nesta fase

**HS256 e não RS256.** Chave assimétrica permite que terceiros verifiquem o
token sem poder assiná-lo — vantagem real quando vários serviços validam o mesmo
token. Existe uma API, que assina e valida. HS256 resolve com uma variável de
ambiente em vez de gestão de chaves. A troca fica contida em `TokenService`.

**Refresh token opaco e não um segundo JWT.** JWT é auto-contido e válido até
expirar — o oposto do que se quer num token cujo propósito é ser revogável. Um
valor aleatório só tem significado porque existe uma linha no banco; apagar a
linha o invalida na hora.

**SHA-256 e não Argon2 para o refresh token.** O token é 32 bytes aleatórios,
imune a ataque de dicionário. Argon2 aqui somaria centenas de milissegundos a
cada renovação sem ganho de segurança, e o salt aleatório impediria a busca pelo
hash.

**Refresh token no corpo da requisição, não em cookie httpOnly.** Cookie entre
origens diferentes exige `SameSite=None`, `Secure`, CORS com credenciais e
proteção contra CSRF — complexidade considerável antes do primeiro usuário. O
custo fica registrado: em `localStorage`, o token é legível por XSS. A mitigação
atual é a rotação com detecção de reuso. Migrar para cookie é a evolução natural
ao sair da validação.

**Enums em português no banco.** Replicam `domain/types.js` do frontend.
Traduzir para inglês criaria uma tabela de conversão entre as pontas — camada
que existe só por preferência de idioma e que vaza erro quando alguém esquece de
atualizá-la.
