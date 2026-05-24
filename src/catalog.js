const PAGES_TO_FETCH = 5
const TMDB_PAGE_SIZE = 20
const ID_BATCH_SIZE = 10

const SORT_MAP = {
  popularidad: { movie: 'popularity.desc', tv: 'popularity.desc' },
  puntuacion: { movie: 'vote_average.desc', tv: 'vote_average.desc' },
  fecha: { movie: 'primary_release_date.desc', tv: 'first_air_date.desc' },
}

const CATALOG_MAP = {
  'popular-movies': { endpoint: '/discover/movie', postFilter: false, fixedSort: null },
  'popular-series': { endpoint: '/discover/tv', postFilter: false, fixedSort: null },
  'hidden-gems-movies': { endpoint: '/discover/movie', postFilter: false, fixedSort: 'vote_average.desc', gems: true },
  'hidden-gems-series': { endpoint: '/discover/tv', postFilter: false, fixedSort: 'vote_average.desc', gems: true },
}

function pickDefaults(raw) {
  return {
    threshold: parseFloat(raw.threshold) || 7.0,
    minVotes: parseInt(raw.minVotes, 10) || 100,
    sort: raw.sort || 'popularidad',
    yearFrom: raw.yearFrom ? parseInt(raw.yearFrom, 10) : null,
  }
}

function buildDiscoverParams(cfg, mediaType, catalogCfg) {
  const p = { language: 'es' }

  p['vote_average.gte'] = cfg.threshold
  p['vote_count.gte'] = cfg.minVotes

  if (catalogCfg.gems) {
    p['vote_count.lte'] = 5000
  }

  if (catalogCfg.fixedSort) {
    p['sort_by'] = catalogCfg.fixedSort
  } else {
    const sortVal = SORT_MAP[cfg.sort] || SORT_MAP.popularidad
    p['sort_by'] = sortVal[mediaType] || sortVal.movie
  }

  if (cfg.yearFrom) {
    const dateKey = mediaType === 'tv' ? 'first_air_date.gte' : 'primary_release_date.gte'
    p[dateKey] = `${cfg.yearFrom}-01-01`
  }

  return p
}

function meetsThreshold(item, cfg) {
  return item.vote_average >= cfg.threshold && item.vote_count >= cfg.minVotes
}

function makeCatalogHandler(tmdb) {
  return async function catalogHandler(args) {
    const { type, id, extra = {}, config = {} } = args

    const catalogCfg = CATALOG_MAP[id]
    if (!catalogCfg) return { metas: [] }

    const cfg = pickDefaults(config)
    const mediaType = type === 'series' ? 'tv' : 'movie'
    const skip = parseInt(extra.skip, 10) || 0
    const startPage = Math.floor(skip / TMDB_PAGE_SIZE) + 1

    if (skip >= 10000) return { metas: [] }

    try {
      let allResults = []

      if (catalogCfg.postFilter) {
        for (let i = 0; i < PAGES_TO_FETCH; i++) {
          const pageNum = startPage + i
          if (pageNum > 1000) break

          const data = await tmdb.fetch(catalogCfg.endpoint, {
            language: 'es',
            page: pageNum,
          })
          allResults = allResults.concat(data.results || [])
          if (!data.results || data.results.length < TMDB_PAGE_SIZE) break
        }
        allResults = allResults.filter((item) => meetsThreshold(item, cfg))
      } else {
        const params = buildDiscoverParams(cfg, mediaType, catalogCfg)

        for (let i = 0; i < PAGES_TO_FETCH; i++) {
          const pageNum = startPage + i
          if (pageNum > 500) break

          const data = await tmdb.fetch(catalogCfg.endpoint, { ...params, page: pageNum })
          allResults = allResults.concat(data.results || [])
          if (!data.results || data.results.length < TMDB_PAGE_SIZE) break
        }
      }

      const itemsToShow = allResults.slice(0, 100)

      for (let i = 0; i < itemsToShow.length; i += ID_BATCH_SIZE) {
        const batch = itemsToShow.slice(i, i + ID_BATCH_SIZE)
        await Promise.all(batch.map(async (item) => {
          try {
            const imdbId = await tmdb.fetchExternalId(item.id, mediaType)
            if (imdbId) item._imdbId = imdbId
          } catch {}
        }))
      }

      const metas = await Promise.all(
        itemsToShow.map((item) => tmdb.transformMeta(item, type, item._imdbId))
      )

      return { metas, cacheMaxAge: 3600 }
    } catch (err) {
      console.error(`[RatingGate] catalog error [${id}]:`, err.message)
      return { metas: [] }
    }
  }
}

module.exports = makeCatalogHandler
