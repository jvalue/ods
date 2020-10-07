
const Koa = require('koa')
const Router = require('koa-router')
const router = new Router()
const app = new Koa()
const { MOCK_SERVER_PORT } = require('./env')

const DATASOURCES = [
  {
    id: 1,
    protocol: {
      type: 'HTTP',
      parameters: {
        location: 'testlocation.de/api'
      }
    },
    format: {
      type: 'XML'
    },
    metadata: {},
    trigger: {
      periodic: true,
      firstExecution: '2018-10-07T01:32:00.123Z',
      interval: 10000
    }
  },
  {
    id: 2,
    protocol: {
      type: 'HTTP',
      parameters: {
        location: 'testlocation.de/api'
      }
    },
    format: {
      type: 'XML'
    },
    metadata: {
      displayName: 'nordstream'
    },
    trigger: {
      periodic: true,
      firstExecution: '2018-10-07T01:32:00.123Z',
      interval: 10000
    }
  }
]

router.get('/datasources/:datasourceId', async ctx => {
  ctx.type = 'application/json'
  const datasourceId = Number(ctx.params.datasourceId)
  let idx = 0
  for (let i = 0; i < DATASOURCES.length; i++) {
    if (DATASOURCES[i].id === datasourceId) {
      idx = i
    }
  }
  ctx.body = DATASOURCES[idx]
})

app.use(router.routes())

const server = app.listen(MOCK_SERVER_PORT, () => console.log('Starting mock adapter server on port ' + MOCK_SERVER_PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Adapter-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
