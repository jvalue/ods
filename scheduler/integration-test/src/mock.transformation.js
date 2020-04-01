const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const axios = require('axios')
const router = new Router()

const PORT = process.env.MOCK_TRANSFORMATION_PORT || 8083
const MOCK_ADAPTER_URL = 'http://' + process.env.MOCK_ADAPTER_HOST + ':' + process.env.MOCK_ADAPTER_PORT

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
  console.log(`POST /job request body: ${JSON.stringify(ctx.request.body)}`)
  ctx.type = 'text/json'
  const dataLocation = ctx.request.body.dataLocation;
  const data = axios.get(MOCK_ADAPTER_URL+"/data/")
  data.test = 'abc'
  ctx.body = { data }
})

router.post('/notification/webhook', async ctx => {
  webhooks.set(ctx.request.body.pipelineName, ctx.request.body)
  ctx.status = 200
})

router.post('/notification/slack', async ctx => {
  slacks.set(ctx.request.body.pipelineName, ctx.request.body)
  ctx.status = 200
})

router.post('/notification/fcm', async ctx => {
  firebases.set(ctx.request.body.pipelineName, ctx.request.body)
  ctx.status = 200
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
