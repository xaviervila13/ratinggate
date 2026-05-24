const manifest = {
  id: 'com.ratinggate.app',
  version: '1.0.0',
  name: 'RatingGate',
  description: 'Filtra catálogos populares por nota mínima. Configura tu umbral y descubre solo contenido de calidad.',

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
      title: 'Nota mínima',
      options: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],
      default: '7.0',
      required: true,
    },
    {
      key: 'minVotes',
      type: 'number',
      title: 'Votos mínimos',
      default: '100',
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
      name: 'Populares (Filtro)',
    },
    {
      type: 'series',
      id: 'popular-series',
      name: 'Series Populares (Filtro)',
    },
    {
      type: 'movie',
      id: 'top-rated-movies',
      name: 'Mejor Valoradas',
    },
    {
      type: 'series',
      id: 'top-rated-series',
      name: 'Series Mejor Valoradas',
    },
    {
      type: 'movie',
      id: 'trending-movies',
      name: 'Tendencias (Filtro)',
    },
    {
      type: 'series',
      id: 'trending-series',
      name: 'Tendencias Series (Filtro)',
    },
    {
      type: 'movie',
      id: 'hidden-gems-movies',
      name: 'Hidden Gems',
    },
    {
      type: 'series',
      id: 'hidden-gems-series',
      name: 'Hidden Gems Series',
    },
  ],
}

module.exports = manifest
