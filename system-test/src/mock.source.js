const Koa = require('koa')
const KoaRouter = require('koa-router')
const bodyParser = require('koa-bodyparser')

const PORT = process.env.MOCK_SOURCE_PORT || 8082

const router = new KoaRouter()
const app = new Koa()
app.use(bodyParser())

const dataStore = new Map() // pipelineId -> data

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.post('/:path', async ctx => {
  const path = ctx.params.path
  console.log(`POST on ${path} received by source mock.`)
  dataStore.set(path, ctx.request.body)
  ctx.status = 201
})

router.get('/:path', async ctx => {
  const path = ctx.params.path
  console.log(`GET on ${path} received by source mock.`)
  ctx.status = 200
  ctx.type = 'application/json'
  ctx.body = dataStore.get(path)
})

app.use(router.routes())

const server = app.listen(PORT, () => console.log('Starting mock source on port ' + PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Storage-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
