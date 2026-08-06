# Roadmap

Este documento define a ordem oficial de desenvolvimento do ROOV.

O objetivo é garantir uma evolução consistente do projeto, evitando retrabalho e preservando a arquitetura ao longo do desenvolvimento.

Cada fase deve estar concluída antes do início da próxima, salvo quando houver justificativa técnica.

---

# Status do Projeto

## Concluído

- Documentação inicial do produto.
- Arquitetura inicial do frontend.
- Interface do MVP.
- Design System.
- Componentes reutilizáveis.
- Motores de recomendação.
- Sistema de DNA.
- Dados simulados.
- Navegação entre módulos.

---

# Fase 1 — Foundation

Objetivo: construir a infraestrutura do backend.

## Entregas

- Estrutura inicial em NestJS.
- Arquitetura modular.
- Configuração do projeto.
- Variáveis de ambiente.
- Integração com PostgreSQL.
- Configuração do Prisma ORM.
- Sistema de migrations.
- Tratamento global de exceções.
- Padronização das respostas da API.
- Validação de requisições.
- Estrutura para testes.

---

# Fase 2 — Autenticação

Objetivo: permitir usuários reais na plataforma.

## Entregas

- Cadastro.
- Login.
- Logout.
- JWT.
- Refresh Token.
- Hash de senhas.
- Guards de autenticação.
- Perfil autenticado.
- Controle de permissões.

---

# Fase 3 — Usuários

Objetivo: implementar o gerenciamento completo de usuários.

## Entregas

- Perfil.
- Edição de informações.
- Avatar.
- Preferências.
- Configurações.
- Estatísticas básicas.

---

# Fase 4 — Lugares

Objetivo: criar a base de dados dos locais.

## Entregas

- Cadastro.
- Atualização.
- Consulta.
- Categorias.
- Localização.
- Horários.
- Informações gerais.

---

# Fase 5 — Feed

Objetivo: permitir compartilhamento de experiências.

## Entregas

- Publicações.
- Fotos.
- Comentários.
- Curtidas.
- Compartilhamentos.
- Histórico.

---

# Fase 6 — DNA

Objetivo: implementar a inteligência principal do ROOV.

## Entregas

- DNA dos lugares.
- DNA dos usuários.
- Afinidade.
- Consolidação.
- Pesos.
- Evolução dinâmica.

---

# Fase 7 — Sistema de Recomendações

Objetivo: transformar os dados em recomendações personalizadas.

## Entregas

- Recomendação contextual.
- Explorar.
- Feed inteligente.
- Sugestões.
- Ordenação.
- Personalização.

---

# Fase 8 — Comunidades

Objetivo: conectar usuários por interesses em comum.

## Entregas

- Criação de comunidades.
- Participação.
- Moderação.
- Publicações.
- Descoberta.
- Administração.

---

# Fase 9 — Agenda

Objetivo: permitir planejamento de experiências.

## Entregas

- Planejamento.
- Calendário.
- Eventos.
- Histórico.
- Organização.
- Lembretes.

---

# Fase 10 — Pesquisa

Objetivo: centralizar toda a descoberta do sistema.

## Entregas

- Pesquisa global.
- Sugestões.
- Histórico.
- Filtros.
- Busca contextual.

---

# Fase 11 — Integrações

Objetivo: conectar o ROOV com serviços externos.

## Entregas

- Supabase Storage.
- Upload de imagens.
- Geolocalização.
- APIs externas.
- Clima.
- Mapas.

---

# Fase 12 — Performance

Objetivo: preparar o sistema para crescimento.

## Entregas

- Cache.
- Otimizações.
- Monitoramento.
- Logs.
- Observabilidade.
- Segurança.

---

# MVP 1

O MVP será considerado concluído quando os seguintes módulos estiverem totalmente funcionais:

- Mapa
- Feed
- Explorar
- Comunidades
- Salvos
- Perfil
- Agenda
- DNA integrado em todo o sistema

---

# Evolução do Roadmap

Este roadmap representa o planejamento atual do projeto.

Novas fases poderão ser adicionadas conforme a evolução do ROOV, mantendo sempre a ordem lógica de construção e preservando a arquitetura existente.