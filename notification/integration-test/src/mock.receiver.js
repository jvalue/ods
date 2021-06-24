const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')

const PORT = process.env.MOCK_RECEIVER_PORT || 8081

const notifications = new Map()

function createMockReceiver () {
  const router = new Router()

  router.get('/', async ctx => {
    ctx.type = 'text/plain'
    ctx.body = 'ok'
  })

  router.post('/:path', async ctx => {
    const path = ctx.params.path
    console.log(`Notification on /${path} triggered.`)
    notifications.set(path, ctx.request.body)
    ctx.status = 201
  })

  router.post('/slack/(.*)', async ctx => {
    console.log('Slack notification triggered.')
    notifications.set('slack', ctx.request.body)
    ctx.status = 201
  })

  const app = new Koa()
  app.use(bodyParser())
  app.use(router.routes())
  return app.listen(PORT, () => console.log(`Starting mock notification receiver on port ${PORT}`))
}

function getTriggeredNotification (type) {
  return notifications.get(type)
}

module.exports = {
  createMockReceiver,
  getTriggeredNotification
}
