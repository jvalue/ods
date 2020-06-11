const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const axios = require('axios').default
const router = new Router()

const PORT = process.env.MOCK_NOTIFICATION_PORT || 8084

const app = new Koa()
app.use(bodyParser())

const webhooks = new Map()
const slacks = new Map()
const firebases = new Map()

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.post('/webhook', async ctx => {
  webhooks.set(ctx.request.body.pipelineName, ctx.request.body)
  ctx.status = 200
})

router.post('/slack', async ctx => {
  slacks.set(ctx.request.body.pipelineName, ctx.request.body)
  ctx.status = 200
})

router.post('/fcm', async ctx => {
  firebases.set(ctx.request.body.pipelineName, ctx.request.body)
  ctx.status = 200
})

router.get('/webhook/:url', async ctx => {
  const url = ctx.params.url
  ctx.type = 'application/json'
  ctx.body = webhooks.get(url)
})

router.get('/slack/:url', async ctx => {
  const url = ctx.params.url
  ctx.type = 'application/json'
  ctx.body = slacks.get(url)
})

router.get('/fcm/:url', async ctx => {
  const url = ctx.params.url
  ctx.type = 'application/json'
  ctx.body = firebases.get(url)
})

app.use(router.routes())

const server = app.listen(PORT, () => console.log('Starting mock notification server on port ' + PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Transformation-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
