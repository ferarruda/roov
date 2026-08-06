/**
 * Posts, usuários, comunidades e biblioteca inicial mockados.
 *
 * Regra 02 (Cap. 7): todo post pertence obrigatoriamente a um lugar.
 * As tags de cada post são o que alimenta o DNA do lugar correspondente.
 */

const img = (id, w = 800) => `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;
const avatar = (id) => `https://images.unsplash.com/${id}?w=120&q=80&auto=format&fit=crop`;

/** Datas relativas a agora, para o feed nunca parecer congelado. */
const hoursAgo = (h) => new Date(Date.now() - h * 3_600_000).toISOString();

export const MOCK_USERS = [
  {
    id: 'u-me',
    name: 'Gabriel Máximo',
    username: 'gabriel',
    avatar: avatar('photo-1534528741775-53994a69daeb'),
    bio: 'Procurando o próximo rolê que vale a pena contar.',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    status: 'ativo',
    role: 'usuario',
  },
  {
    id: 'u-lia',
    name: 'Lia Prado',
    username: 'liaprado',
    avatar: avatar('photo-1494790108377-be9c29b29330'),
    bio: 'Café, parque e pôr do sol.',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    status: 'ativo',
    role: 'usuario',
  },
  {
    id: 'u-teo',
    name: 'Téo Andrade',
    username: 'teoandrade',
    avatar: avatar('photo-1539571696357-5a69c17a67c6'),
    bio: 'Noite paulistana documentada.',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    status: 'ativo',
    role: 'usuario',
  },
  {
    id: 'u-nina',
    name: 'Nina Costa',
    username: 'ninacosta',
    avatar: avatar('photo-1438761681033-6461ffad8d80'),
    bio: 'Cozinha, mercado, feira.',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    status: 'ativo',
    role: 'usuario',
  },
  {
    id: 'u-rafa',
    name: 'Rafa Lopes',
    username: 'rafalopes',
    avatar: avatar('photo-1517841905240-472988babdf9'),
    bio: 'Arte urbana e caminhadas longas.',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    status: 'ativo',
    role: 'usuario',
  },
];

export const CURRENT_USER_ID = 'u-me';

export const MOCK_POSTS = [
  {
    id: 'post-1',
    authorId: 'u-teo',
    placeId: 'p-skye',
    media: [img('photo-1668698460582-11ca2ca82959')],
    mediaType: 'photo',
    caption:
      'Cheguei às 17h só pra pegar o pôr do sol daqui. A cidade inteira ficou laranja por uns 20 minutos.',
    tags: ['rooftop', 'contemplativo', 'romantico', 'casal', 'exclusivo', 'golden-hour'],
    likesCount: 2847,
    commentsCount: 134,
    createdAt: hoursAgo(3),
  },
  {
    id: 'post-2',
    authorId: 'u-lia',
    placeId: 'p-isso-e-cafe',
    media: [img('photo-1501339847302-ac426a4a7cbb')],
    mediaType: 'photo',
    caption: 'Trabalhei a manhã inteira aqui. Wi-fi bom, mesa grande e ninguém te apressa.',
    tags: ['aconchegante', 'tranquilo', 'sozinho', 'descolado', 'manha'],
    likesCount: 512,
    commentsCount: 28,
    createdAt: hoursAgo(6),
  },
  {
    id: 'post-3',
    authorId: 'u-nina',
    placeId: 'p-mercado-municipal',
    media: [img('photo-1567620905732-2d1ec7ab7445')],
    mediaType: 'photo',
    caption:
      'Sanduíche de mortadela no balcão e uma volta pelas bancas de especiaria. Continua sendo o melhor programa de sábado de manhã.',
    tags: ['movimentado', 'historico', 'divertido', 'familia', 'autentico', 'almoco'],
    likesCount: 1934,
    commentsCount: 87,
    createdAt: hoursAgo(14),
  },
  {
    id: 'post-4',
    authorId: 'u-rafa',
    placeId: 'p-beco-batman',
    media: [img('photo-1583421492894-62f94476db99')],
    mediaType: 'photo',
    caption: 'Três murais novos desde a última vez que vim. Nunca é o mesmo beco duas vezes.',
    tags: ['ao-ar-livre', 'surpreendente', 'inspirador', 'amigos', 'descolado', 'alternativo'],
    likesCount: 2341,
    commentsCount: 67,
    createdAt: hoursAgo(22),
  },
  {
    id: 'post-5',
    authorId: 'u-lia',
    placeId: 'p-ibirapuera',
    media: [img('photo-1685937652431-4f855a1994ca')],
    mediaType: 'photo',
    caption: 'Domingo de manhã no Ibira antes do sol apertar. Levei a Maia, ela aprovou.',
    tags: ['ao-ar-livre', 'area-verde', 'relaxante', 'pet-friendly', 'familia', 'natural'],
    likesCount: 892,
    commentsCount: 34,
    createdAt: hoursAgo(30),
  },
  {
    id: 'post-6',
    authorId: 'u-me',
    placeId: 'p-casa-do-porco',
    media: [img('photo-1555939594-58d7cb561ad1')],
    mediaType: 'photo',
    caption: 'Duas horas de fila e valeu cada minuto. Peça o menu degustação e confie.',
    tags: ['movimentado', 'surpreendente', 'memoravel', 'amigos', 'autentico'],
    likesCount: 1204,
    commentsCount: 96,
    createdAt: hoursAgo(48),
  },
  {
    id: 'post-7',
    authorId: 'u-teo',
    placeId: 'p-d-edge',
    media: [img('photo-1470229722913-7c0e2dbbafd3')],
    mediaType: 'photo',
    caption: 'Saí às 6h da manhã e o line-up ainda estava de pé. Melhor som eletrônico da cidade.',
    tags: ['movimentado', 'energizante', 'festivo', 'amigos', 'alternativo', 'madrugada'],
    likesCount: 3521,
    commentsCount: 198,
    createdAt: hoursAgo(54),
  },
  {
    id: 'post-8',
    authorId: 'u-rafa',
    placeId: 'p-masp',
    media: [img('photo-1585601929975-97e932a1ffbe')],
    mediaType: 'photo',
    caption: 'Cavalete de vidro da Lina. Fui pela terceira vez e ainda paro no meio da sala.',
    tags: ['moderno', 'historico', 'inspirador', 'contemplativo', 'sozinho', 'iconico'],
    likesCount: 1622,
    commentsCount: 45,
    createdAt: hoursAgo(72),
  },
  {
    id: 'post-9',
    authorId: 'u-nina',
    placeId: 'p-mocoto',
    media: [img('photo-1414235077428-338989a2e8c0')],
    mediaType: 'photo',
    caption: 'Caldinho de feijão, dadinho de tapioca e cachaça boa. Zona norte não brinca.',
    tags: ['rustico', 'movimentado', 'divertido', 'grupos', 'autentico', 'jantar'],
    likesCount: 1487,
    commentsCount: 72,
    createdAt: hoursAgo(96),
  },
  {
    id: 'post-10',
    authorId: 'u-me',
    placeId: 'p-parque-trianon',
    media: [img('photo-1501854140801-50d01698950b')],
    mediaType: 'photo',
    caption:
      'Mata atlântica no meio da Paulista. Vinte minutos aqui resolvem qualquer terça-feira ruim.',
    tags: ['area-verde', 'reservado', 'zen', 'tranquilo', 'sozinho', 'escondido'],
    likesCount: 673,
    commentsCount: 19,
    createdAt: hoursAgo(120),
  },
  {
    id: 'post-11',
    authorId: 'u-lia',
    placeId: 'p-subastor',
    media: [img('photo-1597075687490-8f673c6c17f6')],
    mediaType: 'photo',
    caption: 'Desce a escada e vira outro mundo. Coquetelaria séria, luz baixa, conversa possível.',
    tags: ['intimista', 'reservado', 'romantico', 'casal', 'escondido', 'noite'],
    likesCount: 986,
    commentsCount: 41,
    createdAt: hoursAgo(150),
  },
  {
    id: 'post-12',
    authorId: 'u-teo',
    placeId: 'p-jardim-botanico',
    media: [img('photo-1502082553048-f009c37129b9')],
    mediaType: 'photo',
    caption: 'Estufa, trilha curta e quase ninguém num sábado de manhã. Vale o deslocamento.',
    tags: ['area-verde', 'ao-ar-livre', 'zen', 'contemplativo', 'familia', 'natural'],
    likesCount: 741,
    commentsCount: 23,
    createdAt: hoursAgo(190),
  },
];

export const MOCK_COMMUNITIES = [
  {
    id: 'c-cafe-sp',
    name: 'Café em SP',
    description:
      'Cafeterias de especialidade, torras novas e mesas boas pra trabalhar. Sem julgamento de método.',
    cover: img('photo-1501339847302-ac426a4a7cbb'),
    type: 'publica',
    category: 'gastronomia',
    city: 'São Paulo',
    membersCount: 12480,
    postsToday: 34,
    tags: ['aconchegante', 'tranquilo', 'sozinho', 'descolado'],
    isMember: true,
    role: 'membro',
  },
  {
    id: 'c-noite-sp',
    name: 'Noite Paulistana',
    description: 'Onde a noite ainda está viva às 3h. Bares, baladas e afters.',
    cover: img('photo-1470229722913-7c0e2dbbafd3'),
    type: 'publica',
    category: 'entretenimento',
    city: 'São Paulo',
    membersCount: 28900,
    postsToday: 112,
    tags: ['festivo', 'energizante', 'movimentado', 'amigos'],
    isMember: true,
    role: 'membro',
  },
  {
    id: 'c-verde-urbano',
    name: 'Verde Urbano',
    description: 'Parques, trilhas urbanas e cantos de mata dentro da cidade.',
    cover: img('photo-1441974231531-c6227db76b6e'),
    type: 'publica',
    category: 'natureza',
    city: 'São Paulo',
    membersCount: 8730,
    postsToday: 21,
    tags: ['area-verde', 'ao-ar-livre', 'zen', 'pet-friendly'],
    isMember: false,
    role: 'visitante',
  },
  {
    id: 'c-arte-rua',
    name: 'Arte de Rua SP',
    description: 'Murais, grafite e intervenções. Mapeando a cidade parede por parede.',
    cover: img('photo-1583421492894-62f94476db99'),
    type: 'publica',
    category: 'passeios',
    city: 'São Paulo',
    membersCount: 5210,
    postsToday: 17,
    tags: ['descolado', 'alternativo', 'inspirador', 'ao-ar-livre'],
    isMember: false,
    role: 'visitante',
  },
  {
    id: 'c-date-night',
    name: 'Date Night',
    description: 'Lugares que salvam um encontro. Curadoria pequena e criteriosa.',
    cover: img('photo-1597075687490-8f673c6c17f6'),
    type: 'privada',
    category: 'entretenimento',
    city: 'São Paulo',
    membersCount: 1940,
    postsToday: 8,
    tags: ['romantico', 'intimista', 'casal', 'sofisticado'],
    isMember: false,
    role: 'visitante',
  },
  {
    id: 'c-domingo-familia',
    name: 'Domingo em Família',
    description: 'Programas com criança, com cachorro e com sogra. Todos cabem.',
    cover: img('photo-1501854140801-50d01698950b'),
    type: 'publica',
    category: 'natureza',
    city: 'São Paulo',
    membersCount: 6410,
    postsToday: 12,
    tags: ['familia', 'kids', 'area-verde', 'relaxante'],
    isMember: false,
    role: 'visitante',
  },
];

/** Biblioteca inicial do usuário — Cap. 14. */
export const MOCK_LIBRARY = [
  { placeId: 'p-skye', kind: 'favorito', addedAt: hoursAgo(200) },
  { placeId: 'p-parque-trianon', kind: 'favorito', addedAt: hoursAgo(400) },
  { placeId: 'p-subastor', kind: 'quero', addedAt: hoursAgo(80) },
  { placeId: 'p-jardim-botanico', kind: 'quero', addedAt: hoursAgo(120) },
  { placeId: 'p-sala-sao-paulo', kind: 'quero', addedAt: hoursAgo(60) },
  { placeId: 'p-casa-do-porco', kind: 'vivido', addedAt: hoursAgo(48) },
  { placeId: 'p-masp', kind: 'vivido', addedAt: hoursAgo(300) },
  { placeId: 'p-mercado-municipal', kind: 'vivido', addedAt: hoursAgo(520) },
  { placeId: 'p-isso-e-cafe', kind: 'favorito', addedAt: hoursAgo(30) },
];

/** Coleções personalizadas — Cap. 45. */
export const MOCK_COLLECTIONS = [
  {
    id: 'col-date',
    name: 'Levar alguém',
    description: 'Pra quando a conversa importa mais que o cardápio',
    emoji: '💘',
    color: '#FF0F7B',
    placeIds: ['p-subastor', 'p-skye', 'p-jun-sakamoto'],
  },
  {
    id: 'col-domingo',
    name: 'Domingo lento',
    description: 'Nada que exija reserva',
    emoji: '🌿',
    color: '#22C55E',
    placeIds: ['p-parque-trianon', 'p-ibirapuera', 'p-isso-e-cafe'],
  },
  {
    id: 'col-visitas',
    name: 'Quando vem visita',
    description: 'O roteiro que nunca falha com quem é de fora',
    emoji: '🧳',
    color: '#FFB400',
    placeIds: ['p-masp', 'p-mercado-municipal', 'p-beco-batman', 'p-teatro-municipal'],
  },
];

/** Agenda — Cap. 15. Datas geradas a partir de hoje. */
const dayOffset = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const MOCK_AGENDA = [
  {
    id: 'ag-1',
    placeId: 'p-isso-e-cafe',
    date: dayOffset(0),
    time: '09:30',
    duration: '1h30',
    notes: 'Terminar a apresentação antes do almoço',
    status: 'confirmado',
  },
  {
    id: 'ag-2',
    placeId: 'p-parque-trianon',
    date: dayOffset(0),
    time: '17:30',
    duration: '45min',
    notes: '',
    status: 'planejado',
  },
  {
    id: 'ag-3',
    placeId: 'p-subastor',
    date: dayOffset(2),
    time: '20:00',
    duration: '2h30',
    notes: 'Aniversário da Lia — chegar antes pra pegar mesa',
    status: 'confirmado',
  },
  {
    id: 'ag-4',
    placeId: 'p-jardim-botanico',
    date: dayOffset(6),
    time: '10:00',
    duration: '3h',
    notes: '',
    status: 'planejado',
  },
  {
    id: 'ag-5',
    placeId: 'p-sala-sao-paulo',
    date: dayOffset(19),
    time: '20:30',
    duration: '2h',
    notes: 'Orquestra Sinfônica — ingresso já comprado',
    status: 'confirmado',
  },
];

/** Gamificação — Cap. 17 e 53. */
export const MOCK_BADGES = [
  {
    id: 'b-primeiro-post',
    label: 'Primeira experiência',
    emoji: '🎬',
    description: 'Publicou o primeiro post',
    unlocked: true,
  },
  {
    id: 'b-explorador',
    label: 'Explorador',
    emoji: '🧭',
    description: '10 lugares diferentes visitados',
    unlocked: true,
  },
  {
    id: 'b-noturno',
    label: 'Coruja',
    emoji: '🦉',
    description: '5 experiências depois da meia-noite',
    unlocked: true,
  },
  {
    id: 'b-curador',
    label: 'Curador',
    emoji: '📚',
    description: '3 coleções com 5+ lugares',
    unlocked: false,
    progress: 0.6,
  },
  {
    id: 'b-local-expert',
    label: 'Local Expert',
    emoji: '🏅',
    description: '25 experiências vividas na mesma cidade',
    unlocked: false,
    progress: 0.32,
  },
  {
    id: 'b-viajante',
    label: 'Viajante',
    emoji: '✈️',
    description: 'Experiências em 3 estados diferentes',
    unlocked: false,
    progress: 0.33,
  },
];

/** Níveis — nome muda conforme XP. */
export const LEVELS = [
  { level: 1, label: 'Explorador', minXp: 0 },
  { level: 2, label: 'Descobridor', minXp: 500 },
  { level: 3, label: 'Local Expert', minXp: 1500 },
  { level: 4, label: 'Embaixador', minXp: 4000 },
  { level: 5, label: 'Lenda', minXp: 10000 },
];

export const MOCK_PROFILE = {
  userId: CURRENT_USER_ID,
  xp: 1840,
  stats: { places: 18, posts: 2, cities: 3, communities: 2 },
  badges: MOCK_BADGES,
};

/** Histórico de pesquisa — Cap. 49, alimenta o DNA do Usuário. */
export const MOCK_SEARCH_HISTORY = [
  'rooftop pôr do sol',
  'café tranquilo vila madalena',
  'parque pet friendly',
  'jantar romântico',
];
