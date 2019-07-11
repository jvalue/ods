const Koa = require("koa");
const Router = require("koa-router");
var bodyParser = require('koa-bodyparser');
const router = new Router();

const PORT = process.env.MOCK_TRANSFORMATION_PORT || 8083;

const app = new Koa();
app.use(bodyParser());

const transformed = {
  field1: 'abc',
  field2: 123,
  field3: {
    name: 'simpleObject'
  },
  field4: [3, 5, 'a', 'z']
};

router.get("/", async ctx => {
  ctx.type = "text/plain";
  ctx.body = "ok"
})

router.post("/job", async ctx => {
  ctx.type = "text/json";
  ctx.body = ctx.request.body.data;
  ctx.body.test = 'abc';
})

app.use(router.routes());

const server = app.listen(PORT, () => console.log("Starting mock transformation server on port " + PORT));

process.on("SIGTERM", async () => {
  console.info("Mock-Transformation-Server: SIGTERM signal received.");
  await server.close();
});

module.exports = server;
