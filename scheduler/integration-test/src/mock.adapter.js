const Koa = require('koa')
const Router = require('koa-router')

const { MOCK_SERVER_PORT } = require('./env')
const { jsonDateAfter } = require('./testHelper')

const router = new Router()
const app = new Koa()

const triggerRequests = new Map()
const initialSources = [
  {
    id: 101,
    trigger: {
      firstExecution: jsonDateAfter(1000),
      periodic: true,
      interval: 1000
    }
  }
]

router.get('/datasources', async ctx => {
  ctx.type = 'application/json'
  ctx.body = initialSources
})

router.post('/datasources/:datasourceId/trigger', async ctx => {
  const id = Number(ctx.params.datasourceId)
  console.log(`Trigger pulled for datasource ${id}`)
  const calls = triggerRequests.get(id)
  if (calls === undefined) {
    triggerRequests.set(id, 1)
  } else {
    triggerRequests.set(id, triggerRequests.get(id) + 1)
  }
  ctx.status = 201
})

router.get('/triggerRequests/:datasourceId', async ctx => {
  const id = Number(ctx.params.datasourceId)
  const calls = triggerRequests.get(id)
  ctx.type = 'text/plain'
  if (calls === undefined) {
    ctx.body = 0
  } else {
    ctx.body = calls
  }
})

app.use(router.routes())

const server = app.listen(MOCK_SERVER_PORT, () => console.log('Starting mock adapter server on port ' + MOCK_SERVER_PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Adapter-Server: SIGTERM signal received.')
  try {
    await server.close()
  } catch (e) {
    console.error('Could not shutdown server')
    console.error(e)
    process.exit(-1)
  }
})

module.exports = server
