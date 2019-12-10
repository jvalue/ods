const Koa = require("koa");
const Router = require("koa-router");
const router = new Router();
const app = new Koa();
const PORT = process.env.MOCK_SERVER_PORT || 8081;

router.get("/", async ctx => {
  ctx.type = "text/plain";
  ctx.body = "ok"
})

router.get("/json", async ctx => {
  console.log("GET /json");
  ctx.body = { whateverwillbe: "willbe", quesera: "sera" };
});

router.get("/xml", async ctx => {
  console.log("GET /xml");

  ctx.type = "text/xml";
  ctx.body =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    "<root><from>Rick</from><to>Morty</to></root>";
});

router.get("/csv", async ctx => {
  console.log("GET /CSV");

  ctx.type = "text/csv";
  ctx.body =
    'col1,col2,col3\n' +
    'val11,val12,val13\n' +
    'val21,val22,val23';
});

app.use(router.routes());

const server = app.listen(PORT, () => console.log("Starting mock server on port " + PORT));

process.on("SIGTERM", async () => {
  console.info("Mock-Server: SIGTERM signal received.");
  await server.close();
});

module.exports = server;
