# Architecture

## Objetivo

Este documento descreve a arquitetura atual do frontend do ROOV.

Seu objetivo é documentar a organização do código, as responsabilidades de cada camada e as regras arquiteturais que devem ser preservadas durante a evolução do projeto.

---

# Tecnologias

O frontend foi desenvolvido utilizando:

- React 18
- JavaScript
- Vite 6
- Tailwind CSS 4
- React Router 6

---

# Princípios da Arquitetura

A arquitetura foi construída seguindo alguns princípios fundamentais.

- Separação entre interface e regras de negócio.
- Componentes reutilizáveis antes de componentes específicos.
- Baixo acoplamento entre módulos.
- Responsabilidades bem definidas para cada camada.
- Regras de negócio independentes da interface.
- Evolução incremental da aplicação.

---

# Organização das Camadas

O frontend está dividido em seis camadas.

Cada uma possui uma responsabilidade específica.

| Camada | Responsabilidade |
|---------|------------------|
| `domain` | Modelos de domínio, tipos e taxonomias oficiais do sistema. |
| `engine` | Algoritmos e regras de negócio responsáveis pela inteligência do produto. |
| `services` | Fonte de dados da aplicação. Atualmente utiliza serviços mock, mantendo a mesma interface que será utilizada futuramente pelo backend. |
| `state` | Estado global da aplicação e orquestração entre serviços e motores. |
| `components` | Componentes reutilizáveis compartilhados entre todos os módulos. |
| `modules` | Funcionalidades da aplicação organizadas por domínio. |

---

# Fluxo da Aplicação

O fluxo padrão da aplicação segue sempre a mesma direção.

```
Usuário
    ↓
Modules
    ↓
State
    ↓
Services
    ↓
Engine
    ↓
Domain
    ↓
State
    ↓
Components
    ↓
Interface
```

Cada camada possui uma responsabilidade única.

Sempre que possível, dependências devem seguir esse fluxo.

---

# Estrutura do Projeto

```
src/
├── components/
├── domain/
├── engine/
├── modules/
├── services/
└── state/
```

## domain

Responsável pelos conceitos centrais do sistema.

Contém:

- modelos
- typedefs
- taxonomias
- estruturas compartilhadas

Nenhuma regra de interface deve existir nesta camada.

---

## engine

Contém toda a inteligência da aplicação.

Exemplos:

- recomendação
- DNA
- momento
- agenda
- pesos
- afinidade

Toda lógica de negócio deve permanecer nesta camada.

---

## services

Responsável pelo acesso aos dados.

Atualmente utiliza serviços mock.

No futuro, essa camada será responsável pela comunicação com a API sem impactar as demais camadas.

---

## state

Centraliza o estado global da aplicação.

É responsável por conectar interface, serviços e motores de negócio.

---

## components

Contém componentes reutilizáveis utilizados por diferentes módulos.

Exemplos:

- PlaceCard
- DnaStrip
- FilterSystem
- SearchBar
- AppShell

Componentes globais nunca devem conter regras de negócio.

---

## modules

Representam as funcionalidades do sistema.

Cada módulo possui responsabilidade própria e reutiliza componentes compartilhados sempre que possível.

Atualmente o projeto possui os módulos:

- Discovery
- Place
- Communities
- Saved
- Profile
- Search
- Create
- Onboarding

---

# Invariantes da Arquitetura

As seguintes regras devem ser preservadas durante toda a evolução do projeto.

## Componentes globais

Todo lugar deve utilizar o `PlaceCard`.

Nenhum módulo deve criar sua própria implementação de card de lugar.

---

## Sistema de filtros

Todos os módulos compartilham o mesmo sistema oficial de filtros.

Não devem existir filtros independentes.

---

## Regras de negócio

Toda regra de negócio deve permanecer na camada `engine`.

Ela nunca deve ser implementada diretamente na interface.

---

## Estado global

O estado compartilhado deve permanecer centralizado na camada `state`.

---

## Domínio

Modelos, tipos e taxonomias pertencem exclusivamente à camada `domain`.

---

## Reutilização

Antes de criar um novo componente, verificar se um componente existente pode ser reutilizado.

Duplicação deve ser evitada.

---

# Estado Atual

Atualmente o frontend utiliza:

- serviços mock com latência simulada;
- mapa baseado em projeção própria;
- clima simulado;
- autenticação ainda não implementada.

A arquitetura foi preparada para permitir a substituição gradual dessas implementações sem necessidade de alterações significativas nas demais camadas.

---

# Evolução

Este documento representa a arquitetura atual do frontend.

Ele deverá ser atualizado sempre que uma decisão arquitetural importante for implementada.

Mudanças de organização, criação de novas camadas ou alterações significativas de responsabilidades devem ser registradas aqui antes de serem consideradas padrão do projeto.