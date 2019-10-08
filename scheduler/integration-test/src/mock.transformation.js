const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const router = new Router()

const PORT = process.env.MOCK_TRANSFORMATION_PORT || 8083

const app = new Koa()
app.use(bodyParser())

const notifications = new Map()

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.post('/job', async ctx => {
  ctx.type = 'text/json'
  ctx.body = ctx.request.body.data
  ctx.body.test = 'abc'
})

router.post('/notifications', async ctx => {
  notifications.set(ctx.request.body.url, ctx.request.body)
  ctx.status = 202
})

router.get('/notifications/:url', async ctx => {
  const url = ctx.params.url
  ctx.type = 'application/json'
  ctx.body = notifications.get(url)
})

app.use(router.routes())

const server = app.listen(PORT, () => console.log('Starting mock transformation server on port ' + PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Transformation-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
