const Koa = require('koa')
const Router = require('koa-router')
const router = new Router()
const app = new Koa()
const PORT = process.env.MOCK_ADAPTER_PORT || 8082

/** DATA IMPORT SECTION **/

const dataImportResponse = {
  id: 1
}

const importedData = {
  field1: 'abc',
  field2: 123,
  field3: {
    name: 'simpleObject'
  },
  field4: [3, 5, 'a', 'z']
}

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.post('/dataImport', async ctx => {
  ctx.type = 'text/json'
  ctx.body = dataImportResponse
})

router.get('/data/:id', async  ctx => {
  ctx.type = 'text/json'
  ctx.body = importedData
})



/** DATASOURCE + EVENTS SECTION **/


const DATASOURCES = [
  {
    id: 1,
    protocol: {
      type: "HTTP",
      parameters: {
        location: "testlocation.de/api"
      },
    },
    format: {
      type: "XML"
    },
    metadata: {},
    trigger: {
      periodic: true,
      firstExecution: '2018-10-07T01:32:00.123Z',
      interval: 10000
    },
  },
  {
    id: 2,
    protocol: {
      type: "HTTP",
      parameters: {
        location: "testlocation.de/api"
      },
    },
    format: {
      type: "XML"
    },
    metadata: {
      displayName: 'nordstream'
    },
    trigger: {
      periodic: true,
      firstExecution: '2018-10-07T01:32:00.123Z',
      interval: 10000
    },
  }
]

const EVENTS = [
  {
    eventId: 347,
    eventType: 'DATASOURCE_CREATE',
    datasourceId: 1
  },
  {
    eventId: 348,
    eventType: 'DATASOURCE_CREATE',
    datasourceId: 2
  },
  {
    eventId: 349,
    eventType: 'DATASOURCE_CREATE',
    datasourceId: 3
  },
  {
    eventId: 350,
    eventType: 'DATASOURCE_DELETE',
    datasourceId: 3
  },
]

router.get('/datasources', async ctx => {
  ctx.type = 'application/json'
  ctx.body = DATASOURCES
})

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

router.get('/datasources/events/latest', async ctx => {
  ctx.type = 'application/json'
  ctx.body = EVENTS[EVENTS.length - 1]
})

router.get('/datasources/events', async ctx => {
  ctx.type = 'application/json'
  const eventsAfter = Number(ctx.query.after) + 1
  let idx = 0
  for (let i = 0; i < EVENTS.length; i++) {
    if (EVENTS[i].eventId === eventsAfter) {
      idx = i
    }
  }
  if (eventsAfter > EVENTS[EVENTS.length - 1].eventId) {
    ctx.body = []
  } else {
    ctx.body = EVENTS.slice(idx)
  }
})



app.use(router.routes())

const server = app.listen(PORT, () => console.log('Starting mock adapter server on port ' + PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Adapter-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
