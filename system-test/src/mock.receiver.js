const Koa = require('koa')
const KoaRouter = require('koa-router')
const bodyParser = require('koa-bodyparser')

const PORT = process.env.MOCK_RECEIVER_PORT || 8081

const router = new KoaRouter()
const app = new Koa()
app.use(bodyParser())

const notificationStore = new Map() // pipelineId -> notification

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.post('/:path', async ctx => {
  const path = ctx.params.path
  console.log(`POST on ${path} received by notification receiver.`)
  notificationStore.set(path, ctx.request.body)
  ctx.status = 201
})

router.get('/:path', async ctx => {
  const path = ctx.params.path
  console.log(`GET on ${path} received by notification receiver.`)
  ctx.status = 200
  ctx.type = 'application/json'
  ctx.body = notificationStore.get(path)
})

app.use(router.routes())

const server = app.listen(PORT, () => console.log('Starting mock receiver server on port ' + PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Storage-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
