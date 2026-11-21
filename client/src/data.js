export const LANGUAGES = {
  python: {
    name: 'Python',
    short: 'Py',
    color: '#67b5f8',
    subtitle: 'Primeiros passos com uma sintaxe simples.',
    sample: 'moedas = 10',
    types: 'str, int, float e bool',
  },
  java: {
    name: 'Java',
    short: 'Ja',
    color: '#f9a65a',
    subtitle: 'Aprenda a declarar variáveis e seus tipos.',
    sample: 'int moedas = 10;',
    types: 'String, int, double e boolean',
  },
  javascript: {
    name: 'JavaScript',
    short: 'JS',
    color: '#f5d74f',
    subtitle: 'Descubra a linguagem que dá vida à web.',
    sample: 'let moedas = 10;',
    types: 'string, number e boolean',
  },
};
export const WORLDS = [
  { name: 'Vale dos Dados', subject: 'Variáveis e tipos', color: 'green', icon: 'chest' },
  { name: 'Cidade das Escolhas', subject: 'Condicionais', color: 'cyan', icon: 'city' },
  { name: 'Rotas em Ciclo', subject: 'Laços de repetição', color: 'orange', icon: 'route' },
  { name: 'Campus dos Objetos', subject: 'Orientação a objetos', color: 'purple', icon: 'campus' },
];
export const TUTORIAL_LABELS = [
  'Boas-vindas',
  'Linguagens',
  'Mundos',
  'Desafios',
  'XP e ranking',
  'Vidas',
  'Perfil',
];
export const missionCount = (ids) =>
  [1, 2, 3, 4, 5].filter((mission) =>
    [1, 2, 3].every((exercise) => ids.includes(`m${mission}-e${exercise}`)),
  ).length;
export const avatarColors = {
  turquoise: '#30d8cf',
  lime: '#b7f143',
  purple: '#bb9af7',
  orange: '#ffb45b',
};
