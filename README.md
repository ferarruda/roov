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
