const BASE_URL = 'https://api.themoviedb.org/3'

const IMAGE_BASE = 'https://image.tmdb.org/t/p'
const POSTER_SIZE = 'w342'
const BG_SIZE = 'original'

class TMDB {
  constructor(token) {
    this.token = token
    this.cache = new Map()
  }

  async fetch(endpoint, params = {}) {
    const url = new URL(BASE_URL + endpoint)
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v))
      }
    })

    const cacheKey = url.toString()
    const cached = this._getCached(cacheKey)
    if (cached) return cached

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`TMDB ${res.status}: ${res.statusText} — ${text.slice(0, 200)}`)
    }

    const data = await res.json()
    this._setCache(cacheKey, data, 3600000)
    return data
  }

  async fetchGenres(type = 'movie') {
    const tmdbType = type === 'series' ? 'tv' : 'movie'
    const cacheKey = `genres-${tmdbType}`
    const now = Date.now()

    const cached = this._getCached(cacheKey)
    if (cached) return cached

    const data = await this.fetch(`/genre/${tmdbType}/list`, { language: 'es' })
    const genres = data.genres || []
    this._setCache(cacheKey, genres, 86400000)
    return genres
  }

  async resolveGenre(genreName, mediaType) {
    if (!genreName) return null
    const genres = await this.fetchGenres(mediaType)
    const lower = genreName.toLowerCase()
    const found = genres.find(
      (g) => g.name.toLowerCase() === lower || g.name.toLowerCase().includes(lower)
    )
    return found ? found.id : null
  }

  async fetchExternalId(tmdbId, type) {
    const endpoint = type === 'tv' ? `/tv/${tmdbId}/external_ids` : `/movie/${tmdbId}/external_ids`
    const data = await this.fetch(endpoint)
    return data.imdb_id || null
  }

  async resolveId(id, type) {
    const strId = String(id)
    if (!strId.startsWith('tt')) return strId

    const cacheKey = `resolve-${strId}`
    const cached = this._getCached(cacheKey)
    if (cached) return cached

    const data = await this.fetch('/find/' + strId, { external_source: 'imdb_id' })
    const results = type === 'tv' ? data.tv_results : data.movie_results
    const tmdbId = results?.[0]?.id
    if (tmdbId) {
      const tmdbStr = String(tmdbId)
      this._setCache(cacheKey, tmdbStr, 86400000)
      return tmdbStr
    }
    return strId
  }

  posterUrl(path) {
    if (!path) return ''
    return `${IMAGE_BASE}/${POSTER_SIZE}${path}`
  }

  bgUrl(path) {
    if (!path) return ''
    return `${IMAGE_BASE}/${BG_SIZE}${path}`
  }

  async transformMeta(item, type, customId) {
    const id = customId || String(item.id)
    const title = item.title || item.name || ''
    const year = (item.release_date || item.first_air_date || '').slice(0, 4)
    const rating = item.vote_average ? String(item.vote_average.toFixed(1)) : undefined

    let genres = []
    if (item.genres && Array.isArray(item.genres)) {
      genres = item.genres.map((g) => (typeof g === 'string' ? g : g.name))
    } else if (item.genre_ids) {
      const genreList = await this.fetchGenres(type)
      genres = item.genre_ids
        .map((id) => {
          const g = genreList.find((g) => g.id === id)
          return g ? g.name : null
        })
        .filter(Boolean)
    }

    const meta = {
      id,
      type,
      name: title,
      poster: this.posterUrl(item.poster_path),
      posterShape: 'poster',
      background: this.bgUrl(item.backdrop_path),
      releaseInfo: year,
      genres,
    }

    if (rating) meta.imdbRating = rating

    return meta
  }

  _getCached(key) {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  _setCache(key, data, ttlMs = 3600000) {
    if (this.cache.size > 300) {
      const first = this.cache.keys().next().value
      if (first) this.cache.delete(first)
    }
    this.cache.set(key, { data, expiry: Date.now() + ttlMs })
  }
}

module.exports = TMDB
