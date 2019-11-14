const Koa = require('koa')
const KoaRouter = require('koa-router')
const bodyParser = require('koa-bodyparser')

const PORT = process.env.MOCK_SOURCE_PORT || 8081

const router = new KoaRouter()
const app = new Koa()
app.use(bodyParser())

const dataStore = new Map()
const dataSequences = new Map()
const sequenceCounters = new Map()

const singleNotifications = new Map()

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.post('/data/:path', async ctx => {
  const path = ctx.params.path
  console.log(`POST on /data/${path} received by mock server.`)
  dataStore.set(path, ctx.request.body)
  ctx.status = 201
})

router.get('/data/:path', async ctx => {
  const path = ctx.params.path
  console.log(`GET on /data/${path} received by mock server.`)
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
  console.log(`POST on /sequences/${path} received by mock server.`)
  dataSequences.set(path, ctx.request.body)
  sequenceCounters.set(path, 0)
  ctx.status = 201
})

router.get('/sequences/:path', async ctx => {
  const path = ctx.params.path
  console.log(`GET on /sequences/${path} received by mock server.`)
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


router.post('/notifications/:path', async ctx => {
  const path = ctx.params.path
  console.log(`POST on /notifications/${path} received by mock server.`)
  singleNotifications.set(path, ctx.request.body)
  ctx.status = 201
})

router.get('/notifications/:path', async ctx => {
  const path = ctx.params.path
  console.log(`GET on /notifications/${path} received by mock server.`)
  const notification = singleNotifications.get(path)
  if(!notification) {
    ctx.throw(404, `No notification has been stored on /notifications/${path}.`)
  } else {
    ctx.body = notification
    ctx.type = 'application/json'
    ctx.status = 200
  }
})

app.use(router.routes())

const server = app.listen(PORT, () => console.log('Starting mock server on port ' + PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
