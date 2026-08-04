/**
 * Modelo de Domínio do ROOV — ROOV Product, Parte V (Cap. 37 a 54).
 *
 * Este arquivo não exporta runtime: só typedefs JSDoc. Serve como contrato
 * único entre os serviços (camada de repositório) e a UI. Se um campo não
 * está aqui, ele não existe no produto.
 */

/**
 * @typedef {Object} GeoPoint
 * @property {number} lat
 * @property {number} lng
 */

/**
 * @typedef {Object} DnaTagRef
 * @property {string} id      id no TAG_INDEX
 * @property {number} weight  peso consolidado (0–1), derivado dos posts
 */

/**
 * DNA ROOV — Cap. 12 e 41. Representa identidade, nunca qualidade.
 * Nunca exibir porcentagem, nota ou estrela.
 * @typedef {Object} Dna
 * @property {DnaTagRef[]} ambiente
 * @property {DnaTagRef[]} vibe
 * @property {DnaTagRef[]} publico
 * @property {DnaTagRef[]} perfil
 * @property {number} contributions  quantos posts formaram este DNA
 */

/**
 * Lugar — Cap. 39. A entidade mais importante do sistema.
 * @typedef {Object} Place
 * @property {string} id
 * @property {string} name
 * @property {import('./taxonomy.js').CategoryId} category
 * @property {string} placeType        tipo do local (PLACE_TYPES)
 * @property {string} neighborhood
 * @property {string} city
 * @property {string} state
 * @property {string} country
 * @property {GeoPoint} coords
 * @property {number} distanceKm       distância do usuário no momento da consulta
 * @property {string[]} photos
 * @property {Dna} dna
 * @property {number} priceRange       1–4
 * @property {{open:string, close:string, closedOn?:number[]}} hours
 * @property {number} postsCount
 * @property {number} savesCount
 * @property {'novo'|'ativo'|'arquivado'|'oculto'} status
 * @property {string} createdAt
 */

/**
 * Post — Cap. 40. Representa uma experiência vivida, nunca só uma foto.
 * Todo post pertence obrigatoriamente a um lugar (Regra 02).
 * @typedef {Object} Post
 * @property {string} id
 * @property {string} authorId
 * @property {string} placeId
 * @property {string[]} media
 * @property {'photo'|'video'} mediaType
 * @property {string} caption
 * @property {string[]} tags            ids de tags que alimentam o DNA do lugar
 * @property {number} likesCount
 * @property {number} commentsCount
 * @property {string} createdAt
 * @property {string} [communityId]
 */

/**
 * Usuário — Cap. 37.
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} username
 * @property {string} avatar
 * @property {string} bio
 * @property {string} city
 * @property {string} state
 * @property {string} country
 * @property {'novo'|'ativo'|'suspenso'|'banido'|'excluido'} status
 * @property {'usuario'|'premium'|'business'|'moderador'|'admin'} role
 */

/**
 * Perfil — Cap. 38 e Sistema de Gamificação (Cap. 53).
 * @typedef {Object} Profile
 * @property {string} userId
 * @property {number} xp
 * @property {number} level
 * @property {string} levelLabel
 * @property {{places:number, posts:number, cities:number, communities:number}} stats
 * @property {Badge[]} badges
 */

/**
 * @typedef {Object} Badge
 * @property {string} id
 * @property {string} label
 * @property {string} emoji
 * @property {string} description
 * @property {boolean} unlocked
 * @property {number} [progress]  0–1 quando ainda bloqueado
 */

/**
 * Entrada da Biblioteca — Cap. 14 e 42.
 * @typedef {Object} LibraryEntry
 * @property {string} placeId
 * @property {'favorito'|'quero'|'vivido'} kind
 * @property {string} addedAt
 */

/**
 * Coleção — Cap. 45.
 * @typedef {Object} Collection
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} emoji
 * @property {string} color
 * @property {string[]} placeIds
 */

/**
 * Agenda — Cap. 15 e 43.
 * @typedef {Object} AgendaItem
 * @property {string} id
 * @property {string} placeId
 * @property {string} date      YYYY-MM-DD
 * @property {string} time      HH:mm
 * @property {string} duration  ex. "2h" | "45min"
 * @property {string} notes
 * @property {'planejado'|'confirmado'|'concluido'|'cancelado'} status
 */

/**
 * Comunidade — Cap. 16 e 44.
 * @typedef {Object} Community
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} cover
 * @property {'publica'|'privada'|'paga'} type
 * @property {import('./taxonomy.js').CategoryId} category
 * @property {string} city
 * @property {number} membersCount
 * @property {number} postsToday
 * @property {string[]} tags
 * @property {boolean} isMember
 * @property {'criador'|'admin'|'moderador'|'membro'|'visitante'} role
 */

/**
 * Recomendação — Cap. 51. Sempre começa pela experiência, nunca pelo lugar.
 * @typedef {Object} Recommendation
 * @property {string} placeId
 * @property {number} score      0–1
 * @property {string} experience título da experiência sugerida
 * @property {string[]} reasons  motivos legíveis, exibidos ao usuário
 */

export {};
