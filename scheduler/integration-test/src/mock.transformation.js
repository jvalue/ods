const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const router = new Router()

const PORT = process.env.MOCK_TRANSFORMATION_PORT || 8083

const app = new Koa()
app.use(bodyParser())

const webhooks = new Map()
const slacks = new Map()
const firebases = new Map()

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.post('/job', async ctx => {
  ctx.type = 'text/json'
  ctx.body = { data: ctx.request.body.data }
  ctx.body.data.test = 'abc'
})

router.post('/notification/webhook', async ctx => {
  webhooks.set(ctx.request.body.pipelineName, ctx.request.body)
  ctx.status = 202
})

router.post('/notification/slack', async ctx => {
  slacks.set(ctx.request.body.pipelineName, ctx.request.body)
  ctx.status = 202
})

router.post('/notification/fcm', async ctx => {
  firebases.set(ctx.request.body.pipelineName, ctx.request.body)
  ctx.status = 202
})

router.get('/notification/webhook/:url', async ctx => {
  const url = ctx.params.url
  ctx.type = 'application/json'
  ctx.body = webhooks.get(url)
})

router.get('/notification/slack/:url', async ctx => {
  const url = ctx.params.url
  ctx.type = 'application/json'
  ctx.body = slacks.get(url)
})

router.get('/notification/fcm/:url', async ctx => {
  const url = ctx.params.url
  ctx.type = 'application/json'
  ctx.body = firebases.get(url)
})

app.use(router.routes())

const server = app.listen(PORT, () => console.log('Starting mock transformation server on port ' + PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Transformation-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
