const Koa = require("koa");
const Router = require("koa-router");
const router = new Router();
const app = new Koa();
const PORT = process.env.MOCK_CORE_PORT || 8081;

const PIPELINES = [
  {
    id: 123,
    adapter: {},
    transformations: [{
      func: "return data;" // not performed in integration testing
    }, {
      func: "return 1;" // not peformed in integration testing
    }],
    persistence: {},
    metadata: {},

    trigger: {
      periodic: true,
      firstExecution: '2018-10-07T01:32:00.123Z',
      interval: 10000
    }
  },
  {
    id: 125,
    adapter: {},
    transformations: [{
      func: "return 1;" // not peformed in integration testing
    }],
    persistence: {},
    metadata: {},

    trigger: {
      periodic: true,
      firstExecution: '2018-10-07T01:32:00.123Z',
      interval: 10000
    }
  }
];

const EVENTS = [
  {
    eventId: 347,
    eventType: "PIPELINE_CREATE",
    pipelineId: 123
  },
  {
    eventId: 348,
    eventType: "PIPELINE_CREATE",
    pipelineId: 124
  },
  {
    eventId: 349,
    eventType: "PIPELINE_CREATE",
    pipelineId: 125
  },
  {
    eventId: 350,
    eventType: "PIPELINE_DELETE",
    pipelineId: 124
  },
  {
    eventId: 351,
    eventType: "PIPELINE_UPDATE",
    pipelineId: 123
  },
  {
    eventId: 352,
    eventType: "PIPELINE_DELETE",
    pipelineId: 125
  }
]

router.get("/", async ctx => {
  ctx.type = "text/plain";
  ctx.body = "ok"
})

router.get("/pipelines", async ctx => {
  ctx.type = "application/json";
  ctx.body = PIPELINES;
})

router.get("/pipelines/:pipelineId", async ctx => {
  ctx.type = "application/json";
  let pipelineId = Number(ctx.params.pipelineId)
  let idx = 0;
  for(i = 0; i < PIPELINES.length; i++) {
    if(PIPELINES[i].id === pipelineId) {
      idx = i;
    }
  }
  ctx.body = PIPELINES[idx]
})

router.get("/events/latest", async ctx => {
  ctx.type = "application/json";
  ctx.body = EVENTS[EVENTS.length-1];
})

router.get("/events", async ctx => {
  ctx.type = "application/json";
  let eventsAfter = Number(ctx.query.after) + 1
  let idx = 0;
  for(i = 0; i < EVENTS.length; i++) {
    if(EVENTS[i].eventId === eventsAfter) {
      idx = i;
    }
  }
  if(eventsAfter > EVENTS[EVENTS.length-1].eventId) {
    ctx.body = []
  } else {
    ctx.body = EVENTS.slice(idx)
  }
})

app.use(router.routes());

const server = app.listen(PORT, () => console.log("Starting mock core server on port " + PORT));
process.on("SIGTERM", async () => {
  console.info("Mock-Core-Server: SIGTERM signal received.");
  await server.close();
});

module.exports = server;
