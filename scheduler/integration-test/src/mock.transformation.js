const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const router = new Router()

const PORT = process.env.MOCK_TRANSFORMATION_PORT || 8083

const app = new Koa()
app.use(bodyParser())

const requests = new Map()

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.post('/trigger', async ctx => {
  const requestBody = ctx.request.body
  const pipelineId = `${requestBody.pipelineId}`
  if (!requests.get(pipelineId)) {
    requests.set(pipelineId, [])
  }
  requests.get(pipelineId).push(requestBody)
  console.log(`Received trigger for pipeline ${pipelineId}`)
  ctx.status = 200
})

router.get('/trigger', async ctx => {
  const pipelineId = `${ctx.params.id}`
  console.log(`Triggers for pipeline ${pipelineId} requested.`)
  if (!requests.get(pipelineId)) {
    ctx.status = 400
    ctx.body = `No triggers received on pipeline ${pipelineId}`
  } else {
    ctx.status = 200
    ctx.body = requests.get(pipelineId)
  }
})

app.use(router.routes())

const server = app.listen(PORT, () => console.log('Starting mock transformation server on port ' + PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Transformation-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
