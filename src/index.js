require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { addonBuilder } = require('stremio-addon-sdk')
const getRouter = require('stremio-addon-sdk/src/getRouter')
const manifest = require('./manifest')
const TMDB = require('./tmdb')
const makeCatalogHandler = require('./catalog')
const makeMetaHandler = require('./meta')
const getConfigureHandler = require('./configure')

const token = process.env.TMDB_TOKEN
if (!token) {
  console.error('Falta TMDB_TOKEN en .env')
  process.exit(1)
}

const tmdb = new TMDB(token)
const builder = new addonBuilder(manifest)

builder.defineCatalogHandler(makeCatalogHandler(tmdb))
builder.defineMetaHandler(makeMetaHandler(tmdb))

const addonInterface = builder.getInterface()
const port = parseInt(process.env.PORT, 10) || 7000

const app = express()
app.use(cors())

app.get('/configure', getConfigureHandler(manifest))
app.use('/', getRouter(addonInterface))

const landingHTML = require('stremio-addon-sdk/src/landingTemplate')(manifest)
app.get('/', (req, res) => {
  if (manifest.config?.length) return res.redirect('/configure')
  res.setHeader('content-type', 'text/html')
  res.end(landingHTML)
})

app.listen(port, () => {
  const url = `http://127.0.0.1:${port}/manifest.json`
  console.log(`  RatingGate addon corriendo en ${url}\n`)
})
