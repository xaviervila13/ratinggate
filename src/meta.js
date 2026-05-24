function formatRuntime(minutes) {
  if (!minutes) return undefined
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

function pickTrailers(videos) {
  if (!videos?.results) return undefined
  const filtered = videos.results
    .filter((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
    .slice(0, 3)
  return filtered.length ? filtered.map((t) => ({ source: t.key, type: t.type })) : undefined
}

function pickCast(credits) {
  if (!credits?.cast) return undefined
  const top = credits.cast.slice(0, 10)
  return top.length ? top.map((c) => c.name) : undefined
}

function pickDirectors(credits) {
  if (!credits?.crew) return undefined
  const directors = credits.crew.filter((c) => c.job === 'Director')
  return directors.length ? directors.map((d) => d.name) : undefined
}

function toISO(dateStr) {
  if (!dateStr) return undefined
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? undefined : d.toISOString()
}

async function handleMovieMeta(tmdb, id, displayId) {
  const data = await tmdb.fetch(`/movie/${id}`, {
    append_to_response: 'videos,credits',
    language: 'es',
  })

  const meta = {
    id: displayId || String(data.id),
    type: 'movie',
    name: data.title,
    poster: tmdb.posterUrl(data.poster_path),
    posterShape: 'poster',
    background: tmdb.bgUrl(data.backdrop_path),
    description: data.overview || '',
    releaseInfo: (data.release_date || '').slice(0, 4),
    imdbRating: data.vote_average ? String(data.vote_average.toFixed(1)) : undefined,
    genres: (data.genres || []).map((g) => g.name),
    runtime: formatRuntime(data.runtime),
    released: toISO(data.release_date),
    director: pickDirectors(data.credits),
    cast: pickCast(data.credits),
    trailers: pickTrailers(data.videos),
  }

  return { meta }
}

async function handleSeriesMeta(tmdb, id, displayId) {
  const data = await tmdb.fetch(`/tv/${id}`, {
    append_to_response: 'videos,credits',
    language: 'es',
  })

  const firstYear = (data.first_air_date || '').slice(0, 4)
  const ended = data.status === 'Ended'
  const lastYear = ended ? (data.last_air_date || '').slice(0, 4) : ''
  const releaseInfo = lastYear ? `${firstYear}-${lastYear}` : `${firstYear}-`

  const meta = {
    id: displayId || String(data.id),
    type: 'series',
    name: data.name,
    poster: tmdb.posterUrl(data.poster_path),
    posterShape: 'poster',
    background: tmdb.bgUrl(data.backdrop_path),
    description: data.overview || '',
    releaseInfo,
    imdbRating: data.vote_average ? String(data.vote_average.toFixed(1)) : undefined,
    genres: (data.genres || []).map((g) => g.name),
    runtime: data.episode_run_time?.[0] ? formatRuntime(data.episode_run_time[0]) : undefined,
    status: data.status,
    cast: pickCast(data.credits),
    trailers: pickTrailers(data.videos),
  }

  const seasons = (data.seasons || []).filter((s) => s.season_number > 0 && s.episode_count > 0)
  const videos = []

  for (const season of seasons) {
    const seasonData = await tmdb.fetch(`/tv/${id}/season/${season.season_number}`, {
      language: 'es',
    })

    if (seasonData.episodes) {
      for (const ep of seasonData.episodes) {
        videos.push({
          id: `${season.season_number}:${ep.episode_number}`,
          title: ep.name || `Episodio ${ep.episode_number}`,
          season: season.season_number,
          episode: ep.episode_number,
          released: toISO(ep.air_date),
          overview: ep.overview || '',
        })
      }
    }
  }

  if (videos.length > 0) meta.videos = videos

  return { meta }
}

function makeMetaHandler(tmdb) {
  return async function metaHandler(args) {
    const { type, id } = args

    try {
      const mediaType = type === 'series' ? 'tv' : 'movie'
      const tmdbId = await tmdb.resolveId(id, mediaType)
      if (type === 'movie') return await handleMovieMeta(tmdb, tmdbId, id)
      if (type === 'series') return await handleSeriesMeta(tmdb, tmdbId, id)
      return { meta: {} }
    } catch (err) {
      console.error('[RatingGate] meta error:', err.message)
      return { meta: {} }
    }
  }
}

module.exports = makeMetaHandler
