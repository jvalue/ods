const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')

const PORT = process.env.MOCK_RECEIVER_PORT || 8081

const router = new Router()
const app = new Koa()
app.use(bodyParser())

let data1
let data2

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.post('/webhook1', async ctx => {
  console.log('webhook triggered')
  ctx.status = 201
  data1 = ctx.request.body
  console.log('data received on webhook1: ' + JSON.stringify(data1))
})

router.post('/webhook2', async ctx => {
  console.log('webhook triggered')
  ctx.status = 201
  data2 = ctx.request.body
  console.log('data received on webhook2: ' + JSON.stringify(data2))
})

router.get('/data1', async ctx => {
  if (typeof data1 !== 'undefined') {
    ctx.status = 200
    ctx.type = 'application/json'
    ctx.body = data1
  } else {
    ctx.throw(404)
  }
})

router.get('/data2', async ctx => {
  if (typeof data2 !== 'undefined') {
    ctx.status = 200
    ctx.type = 'application/json'
    ctx.body = data2
  } else {
    ctx.throw(404)
  }
})

app.use(router.routes())

const server = app.listen(PORT, () => console.log('Starting mock storage server on port ' + PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Storage-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
