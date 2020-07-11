const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const axios = require('axios').default
const router = new Router()

const PORT = process.env.MOCK_NOTIFICATION_PORT || 8084

const app = new Koa()
app.use(bodyParser())

const triggers = new Map()

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.post('/trigger', async ctx => {
  const pipelineId = ctx.request.body.pipelineId
  triggers.set("" + pipelineId, ctx.request.body)
  console.log(`[Notification Mock] Stored trigger reachable under '/trigger/${pipelineId}' ${JSON.stringify(ctx.request.body)}`)
  ctx.status = 201
})

router.get('/trigger/:pipelineId', async ctx => {
  const pipelineId = ctx.params.pipelineId
  ctx.type = 'application/json'
  ctx.body = triggers.get("" + pipelineId)
  console.log(`[Notification Mock] Requested trigger for pipeline ${pipelineId}: ${JSON.stringify(ctx.body)}`)
  ctx.status = 200
})

app.use(router.routes())

const server = app.listen(PORT, () => console.log('Starting mock notification server on port ' + PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Transformation-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
