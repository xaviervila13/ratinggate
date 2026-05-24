const manifest = {
  id: 'com.ratinggate.app',
  version: '1.0.0',
  name: 'RatingGate',
  description: 'Filtra catálogos populares por nota mínima (TMDB). Configura tu umbral y descubre solo contenido de calidad.',

  resources: ['catalog', 'meta'],
  types: ['movie', 'series'],

  behaviorHints: {
    configurable: true,
    configurationRequired: false,
  },

  config: [
    {
      key: 'threshold',
      type: 'select',
      title: 'Nota mínima (TMDB)',
      options: ['5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5'],
      default: '7.0',
      required: true,
    },
    {
      key: 'minVotes',
      type: 'number',
      title: 'Votos mínimos',
      default: '300',
      required: false,
    },
    {
      key: 'sort',
      type: 'select',
      title: 'Ordenar por',
      options: ['popularidad', 'puntuacion', 'fecha'],
      default: 'popularidad',
      required: false,
    },
    {
      key: 'yearFrom',
      type: 'number',
      title: 'Ano desde (dejar vacio = sin limite)',
      default: '',
      required: false,
    },
  ],

  catalogs: [
    {
      type: 'movie',
      id: 'popular-movies',
      name: 'RatingGate - Populares',
    },
    {
      type: 'series',
      id: 'popular-series',
      name: 'RatingGate - Series Populares',
    },
    {
      type: 'movie',
      id: 'hidden-gems-movies',
      name: 'RatingGate - Hidden Gems',
    },
    {
      type: 'series',
      id: 'hidden-gems-series',
      name: 'RatingGate - Hidden Gems Series',
    },
  ],
}

module.exports = manifest
