const Koa = require("koa");
const Router = require("koa-router");
const router = new Router();
const app = new Koa();
const PORT = process.env.MOCK_SERVER_PORT || 8081;

const PIPELINES = [
  {
    id: 123,
    adapter: {},
    transformations: {},
    persistence: {},
    metadata: {},

    trigger: {
      periodic: true,
      firstExecution: Date.UTC(2019, 1, 1, 12, 5, 12, 30),
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

const server = app.listen(PORT, () => console.log("Starting mock server on port " + PORT));

process.on("SIGTERM", async () => {
  console.info("Mock-Server: SIGTERM signal received.");
  await server.close();
});

module.exports = server;
