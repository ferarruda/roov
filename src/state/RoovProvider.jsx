/**
 * Application Layer — ROOV Product, Cap. 26.
 *
 * Orquestra os motores inteligentes e expõe um único contexto para os módulos.
 * Nenhuma tela conversa com `services/` diretamente: tudo passa por aqui, para
 * que biblioteca, agenda, filtros e DNA fiquem sempre coerentes entre módulos.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  communitiesService,
  libraryService,
  placesService,
  postsService,
  usersService,
} from '../services/index.js';
import { buildMomentDna } from '../engine/moment.js';
import { buildUserDna } from '../engine/dna.js';
import { EMPTY_FILTERS } from '../domain/taxonomy.js';

const RoovContext = createContext(null);

const initialState = {
  ready: false,
  user: null,
  profile: null,
  places: [],
  posts: [],
  communities: [],
  /** @type {import('../domain/types.js').LibraryEntry[]} */
  library: [],
  collections: [],
  agenda: [],
  searchHistory: [],
  dismissedPlaceIds: [],
  likedPostIds: [],
  /** Filtros globais: permanecem durante toda a navegação (Cap. 10). */
  filters: EMPTY_FILTERS,
  toast: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.payload, ready: true };

    case 'setFilters':
      return { ...state, filters: action.filters };

    case 'resetFilters':
      return { ...state, filters: { ...EMPTY_FILTERS, query: state.filters.query } };

    case 'toggleLibrary': {
      const { placeId, kind } = action;
      const exists = state.library.some((e) => e.placeId === placeId && e.kind === kind);
      const library = exists
        ? state.library.filter((e) => !(e.placeId === placeId && e.kind === kind))
        : [...state.library, { placeId, kind, addedAt: new Date().toISOString() }];
      return { ...state, library };
    }

    case 'createCollection':
      return { ...state, collections: [...state.collections, action.collection] };

    case 'toggleInCollection': {
      const collections = state.collections.map((c) => {
        if (c.id !== action.collectionId) return c;
        const has = c.placeIds.includes(action.placeId);
        return {
          ...c,
          placeIds: has
            ? c.placeIds.filter((id) => id !== action.placeId)
            : [...c.placeIds, action.placeId],
        };
      });
      return { ...state, collections };
    }

    case 'addAgendaItem':
      return { ...state, agenda: [...state.agenda, action.item] };

    case 'updateAgendaItem':
      return {
        ...state,
        agenda: state.agenda.map((i) => (i.id === action.item.id ? action.item : i)),
      };

    case 'removeAgendaItem':
      return { ...state, agenda: state.agenda.filter((i) => i.id !== action.id) };

    case 'toggleLike': {
      const liked = state.likedPostIds.includes(action.postId);
      return {
        ...state,
        likedPostIds: liked
          ? state.likedPostIds.filter((id) => id !== action.postId)
          : [...state.likedPostIds, action.postId],
        posts: state.posts.map((p) =>
          p.id === action.postId
            ? { ...p, likesCount: p.likesCount + (liked ? -1 : 1) }
            : p,
        ),
      };
    }

    case 'dismissPlace':
      return { ...state, dismissedPlaceIds: [...state.dismissedPlaceIds, action.placeId] };

    case 'toggleCommunity':
      return {
        ...state,
        communities: state.communities.map((c) =>
          c.id === action.communityId
            ? {
                ...c,
                isMember: !c.isMember,
                role: c.isMember ? 'visitante' : 'membro',
                membersCount: c.membersCount + (c.isMember ? -1 : 1),
              }
            : c,
        ),
      };

    case 'recordSearch': {
      const term = action.term.trim();
      if (!term) return state;
      return {
        ...state,
        searchHistory: [term, ...state.searchHistory.filter((t) => t !== term)].slice(0, 10),
      };
    }

    case 'addPost': {
      const places = state.places.map((p) =>
        p.id === action.place?.id ? action.place : p,
      );
      return { ...state, posts: [action.post, ...state.posts], places };
    }

    case 'toast':
      return { ...state, toast: action.toast };

    default:
      return state;
  }
}

export function RoovProvider({ children, authUser }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      usersService.me(),
      usersService.profile(),
      usersService.searchHistory(),
      placesService.list(),
      postsService.feed(),
      communitiesService.list(),
      libraryService.entries(),
      libraryService.collections(),
      libraryService.agenda(),
    ]).then(
      ([user, profile, searchHistory, places, posts, communities, library, collections, agenda]) => {
        if (cancelled) return;
        dispatch({
          type: 'hydrate',
          payload: {
            user,
            profile,
            searchHistory,
            places,
            posts,
            communities,
            library,
            collections,
            agenda,
          },
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  /** Toast some sozinho — sem lib externa. */
  useEffect(() => {
    if (!state.toast) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'toast', toast: null }), 2600);
    return () => clearTimeout(timer);
  }, [state.toast]);

  const placeById = useMemo(
    () => Object.fromEntries(state.places.map((p) => [p.id, p])),
    [state.places],
  );

  /**
   * DNA do Momento — recalculado a cada 5 minutos, porque é o motor mais
   * dinâmico do produto (Cap. 59).
   */
  const [momentTick, tickMoment] = useReducer((n) => n + 1, 0);
  useEffect(() => {
    const timer = setInterval(tickMoment, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const moment = useMemo(
    () => buildMomentDna({ city: state.user ? `${state.user.city}, ${state.user.state}` : undefined }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.user, momentTick],
  );

  /** Biblioteca indexada — consultada por praticamente todo componente. */
  const library = useMemo(() => {
    const byPlace = {};
    for (const entry of state.library) {
      (byPlace[entry.placeId] ??= []).push(entry.kind);
    }
    return {
      byPlace,
      kindsOf: (placeId) => byPlace[placeId] ?? [],
      has: (placeId, kind) => (byPlace[placeId] ?? []).includes(kind),
      placeIdsOf: (kind) =>
        state.library.filter((e) => e.kind === kind).map((e) => e.placeId),
    };
  }, [state.library]);

  /** DNA do Usuário — reconstruído sempre que um sinal muda (Cap. 57). */
  const userDna = useMemo(() => {
    const resolve = (ids) => ids.map((id) => placeById[id]).filter(Boolean);
    return buildUserDna({
      livedPlaces: resolve(library.placeIdsOf('vivido')),
      favoritePlaces: resolve(library.placeIdsOf('favorito')),
      wantPlaces: resolve(library.placeIdsOf('quero')),
      agendaPlaces: resolve(state.agenda.map((a) => a.placeId)),
      dismissedPlaces: resolve(state.dismissedPlaceIds),
      searches: state.searchHistory,
    });
  }, [library, placeById, state.agenda, state.dismissedPlaceIds, state.searchHistory]);

  /** Lugares que o usuário já conhece — usado para priorizar descoberta. */
  const knownPlaceIds = useMemo(
    () =>
      new Set([
        ...state.library.map((e) => e.placeId),
        ...state.agenda.map((a) => a.placeId),
      ]),
    [state.library, state.agenda],
  );

  const toast = useCallback(
    (message, tone = 'default') => dispatch({ type: 'toast', toast: { message, tone } }),
    [],
  );

  const actions = useMemo(
    () => ({
      setFilters: (filters) => dispatch({ type: 'setFilters', filters }),
      patchFilters: (patch) =>
        dispatch({ type: 'setFilters', filters: { ...state.filters, ...patch } }),
      resetFilters: () => dispatch({ type: 'resetFilters' }),

      toggleLibrary: (placeId, kind, label) => {
        const had = library.has(placeId, kind);
        dispatch({ type: 'toggleLibrary', placeId, kind });
        toast(had ? `Removido de ${label}` : `Salvo em ${label}`);
      },

      createCollection: (collection) => {
        dispatch({ type: 'createCollection', collection });
        toast(`Coleção "${collection.name}" criada`);
      },
      toggleInCollection: (collectionId, placeId) =>
        dispatch({ type: 'toggleInCollection', collectionId, placeId }),

      addAgendaItem: (item) => {
        dispatch({ type: 'addAgendaItem', item });
        toast('Adicionado à agenda');
      },
      updateAgendaItem: (item) => dispatch({ type: 'updateAgendaItem', item }),
      removeAgendaItem: (id) => {
        dispatch({ type: 'removeAgendaItem', id });
        toast('Removido da agenda');
      },

      toggleLike: (postId) => dispatch({ type: 'toggleLike', postId }),
      dismissPlace: (placeId) => dispatch({ type: 'dismissPlace', placeId }),
      toggleCommunity: (communityId, name, wasMember) => {
        dispatch({ type: 'toggleCommunity', communityId });
        toast(wasMember ? `Você saiu de ${name}` : `Bem-vindo a ${name}`);
      },
      recordSearch: (term) => dispatch({ type: 'recordSearch', term }),

      publishPost: async (draft) => {
        const post = await postsService.create(draft);
        const place = await placesService.byId(draft.placeId);
        dispatch({ type: 'addPost', post, place });
        toast('Experiência publicada');
        return post;
      },

      toast,
    }),
    [library, state.filters, toast],
  );

  /**
   * Identidade real por cima da mock — reativo, de propósito (Fase 3, corte
   * 2): edições feitas em `AuthProvider.updateProfile` mudam `authUser`, e
   * este `useMemo` roda de novo, então o Perfil reflete a edição sem precisar
   * de dispatch nenhum. `id` nunca muda: é a chave que liga posts/biblioteca/
   * DNA mock, e trocá-la quebraria essas relações.
   */
  const user = useMemo(
    () =>
      authUser && state.user
        ? {
            ...state.user,
            name: authUser.name,
            username: authUser.username,
            avatar: authUser.avatar,
            bio: authUser.bio,
            city: authUser.city,
            state: authUser.state,
            country: authUser.country,
          }
        : state.user,
    [state.user, authUser],
  );

  const value = useMemo(
    () => ({ ...state, user, placeById, library, userDna, moment, knownPlaceIds, actions }),
    [state, user, placeById, library, userDna, moment, knownPlaceIds, actions],
  );

  return <RoovContext.Provider value={value}>{children}</RoovContext.Provider>;
}

export function useRoov() {
  const ctx = useContext(RoovContext);
  if (!ctx) throw new Error('useRoov precisa estar dentro de <RoovProvider>.');
  return ctx;
}
