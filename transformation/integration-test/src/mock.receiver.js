const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')

const PORT = process.env.MOCK_RECEIVER_PORT || 8081

const router = new Router()
const app = new Koa()
app.use(bodyParser())

const notifications = new Map()

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.get('/:path', async ctx => {
  const path = ctx.params.path
  const notification = notifications.get(path)
  if(!notification) {
    ctx.throw(404)
  } else {
    ctx.body = notification
    ctx.type = 'application/json'
    ctx.status = 200
  }
})

router.post('/:path', async ctx => {
  const path = ctx.params.path
  console.log(`Notification on /${path} triggered.`)
  notifications.set(path, ctx.request.body)
  ctx.status = 201
})
app.use(router.routes())

const server = app.listen(PORT, () => console.log(`Starting mock notification receiver on port ${PORT}`))

process.on('SIGTERM', async () => {
  console.info('Mock-Notification-Receiver: SIGTERM signal received.')
  await server.close()
})

module.exports = server
