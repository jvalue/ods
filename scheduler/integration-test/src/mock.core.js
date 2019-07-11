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
  }
];

router.get("/", async ctx => {
  ctx.type = "text/plain";
  ctx.body = "ok"
})

router.get("/pipelines", async ctx => {
  ctx.type = "text/json";
  ctx.body = PIPELINES;
})

app.use(router.routes());

const server = app.listen(PORT, () => console.log("Starting mock core server on port " + PORT));

process.on("SIGTERM", async () => {
  console.info("Mock-Core-Server: SIGTERM signal received.");
  await server.close();
});

module.exports = server;
