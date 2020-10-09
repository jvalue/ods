
const Koa = require('koa')
const Router = require('koa-router')
const router = new Router()
const app = new Koa()
const { MOCK_SERVER_PORT } = require('./env')

const triggerRequests = new Map()
const initialSources = [
  {
    datasourceId: 100,
    trigger: {
      firstExecution: Date.now() + 4000,
      periodic: false,
      interval: 0
    }
  },
  {
    datasourceId: 101,
    trigger: {
      firstExecution: Date.now() + 1000,
      periodic: true,
      interval: 1000
    }
  }
]

router.get('/datasources/', (req, res) => {
  res.send(initialSources)
})

router.post('/datasources/:datasourceId/trigger', (req, res) => {
  const id = Number(req.params.datasourceId)
  const calls = triggerRequests.get(id)
  if (calls === undefined) {
    triggerRequests.set(id, 1)
  } else {
    triggerRequests.set(id, triggerRequests.get(id) + 1)
  }
  res.sendStatus(200)
})

router.get('/triggerRequests/:datasourceId', (req, res) => {
  const id = Number(req.params.datasourceId)
  const calls = triggerRequests.get(id)
  if (calls === undefined) {
    res.send(0)
  } else {
    res.send(calls)
  }
})

app.use(router.routes())

const server = app.listen(MOCK_SERVER_PORT, () => console.log('Starting mock adapter server on port ' + MOCK_SERVER_PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Adapter-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
