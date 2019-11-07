const Koa = require('koa')
const KoaRouter = require('koa-router')
const bodyParser = require('koa-bodyparser')

const PORT = process.env.MOCK_SOURCE_PORT || 8082

const router = new KoaRouter()
const app = new Koa()
app.use(bodyParser())

const dataStore = new Map()
const dataSequences = new Map()
const sequenceCounters = new Map()

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.post('/data/:path', async ctx => {
  const path = ctx.params.path
  console.log(`POST on /data/${path} received by source mock.`)
  dataStore.set(path, ctx.request.body)
  ctx.status = 201
})

router.get('/data/:path', async ctx => {
  const path = ctx.params.path
  console.log(`GET on /data/${path} received by source mock.`)
  const data = dataStore.get(path)
  if(!data) {
    ctx.throw(404, `No data available for /data/${path}`)
  } else {
    ctx.body = data
    ctx.type = 'application/json'
    ctx.status = 200
  }
})

router.post('/sequences/:path', async ctx => {
  const path = ctx.params.path
  console.log(`POST on /sequences/${path} received by source mock.`)
  dataSequences.set(path, ctx.request.body)
  sequenceCounters.set(path, 0)
  ctx.status = 201
})

router.get('/sequences/:path', async ctx => {
  const path = ctx.params.path
  console.log(`GET on /sequences/${path} received by source mock.`)
  const sequenceCounter = sequenceCounters.get(path)
  if(typeof sequenceCounter === "undefined") {
    ctx.throw(404, `No data available for /sequences/${path}`)
  } else {
    let data = dataSequences.get(path)
    data.count = sequenceCounter
    sequenceCounters.set(path, sequenceCounter + 1)
    ctx.body = data
    ctx.status = 200
  }
})

app.use(router.routes())

const server = app.listen(PORT, () => console.log('Starting source mock on port ' + PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Storage-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
