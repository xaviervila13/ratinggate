const { addonBuilder, serveHTTP } = require('stremio-addon-sdk')
const manifest = require('./manifest')
const TMDB = require('./tmdb')
const makeCatalogHandler = require('./catalog')
const makeMetaHandler = require('./meta')

const token = process.env.TMDB_TOKEN
if (!token) {
  console.error('Falta TMDB_TOKEN en .env')
  process.exit(1)
}

const tmdb = new TMDB(token)
const builder = new addonBuilder(manifest)

builder.defineCatalogHandler(makeCatalogHandler(tmdb))
builder.defineMetaHandler(makeMetaHandler(tmdb))

const port = parseInt(process.env.PORT, 10) || 7000
serveHTTP(builder.getInterface(), { port })

console.log(`\n  RatingGate addon corriendo en http://127.0.0.1:${port}/manifest.json\n`)
