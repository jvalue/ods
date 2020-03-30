const Koa = require('koa')
const Router = require('koa-router')
const router = new Router()
const app = new Koa()
const PORT = process.env.MOCK_CORE_PORT || 8081

const PIPELINES = [
  {
    id: 123,
    adapter: {
      protocol: {
        type: "HTTP",
        parameters: {
          location: "testlocation.de/api"
        },
      },
      format: {
        type: "XML"
      }
    },
    transformation: {
      func: 'return data;' // not performed in integration testing
    },
    persistence: {},
    metadata: {},
    trigger: {
      periodic: true,
      firstExecution: '2018-10-07T01:32:00.123Z',
      interval: 10000
    },
    notifications: []
  },
  {
    id: 125,
    adapter: {
      protocol: {
        type: "HTTP",
        parameters: {
          location: "testlocation.de/api"
        },
      },
      format: {
        type: "XML"
      }
    },
    transformation: {
      func: 'return 1;' // not peformed in integration testing
    },
    persistence: {},
    metadata: {
      displayName: 'nordstream'
    },
    trigger: {
      periodic: true,
      firstExecution: '2018-10-07T01:32:00.123Z',
      interval: 10000
    },
    notifications: [
      {
        type: 'SLACK',
        condition: 'data.field2 === 123',
        url: 'should-be-triggered'
      },
      {
        type: 'WEBHOOK',
        condition: 'data.field2 < 0',
        url: 'should-also-be-triggered'
      },
      {
        type: 'FCM',
        condition: 'data.field2 === 123',
        url: 'should-be-triggered'
      }
    ]
  }
]

const EVENTS = [
  {
    eventId: 347,
    eventType: 'PIPELINE_CREATE',
    pipelineId: 123
  },
  {
    eventId: 348,
    eventType: 'PIPELINE_CREATE',
    pipelineId: 124
  },
  {
    eventId: 349,
    eventType: 'PIPELINE_CREATE',
    pipelineId: 125
  },
  {
    eventId: 350,
    eventType: 'PIPELINE_DELETE',
    pipelineId: 124
  },
  {
    eventId: 351,
    eventType: 'PIPELINE_UPDATE',
    pipelineId: 123
  },
  {
    eventId: 352,
    eventType: 'PIPELINE_DELETE',
    pipelineId: 125
  }
]

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.get('/pipelines', async ctx => {
  ctx.type = 'application/json'
  ctx.body = PIPELINES
})

router.get('/pipelines/:pipelineId', async ctx => {
  ctx.type = 'application/json'
  const pipelineId = Number(ctx.params.pipelineId)
  let idx = 0
  for (let i = 0; i < PIPELINES.length; i++) {
    if (PIPELINES[i].id === pipelineId) {
      idx = i
    }
  }
  ctx.body = PIPELINES[idx]
})

router.get('/events/latest', async ctx => {
  ctx.type = 'application/json'
  ctx.body = EVENTS[EVENTS.length - 1]
})

router.get('/events', async ctx => {
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

const server = app.listen(PORT, () => console.log('Starting mock core server on port ' + PORT))
process.on('SIGTERM', async () => {
  console.info('Mock-Core-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
