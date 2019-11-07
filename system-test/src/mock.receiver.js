const Koa = require('koa')
const KoaRouter = require('koa-router')
const bodyParser = require('koa-bodyparser')

const PORT = process.env.MOCK_RECEIVER_PORT || 8081

const router = new KoaRouter()
const app = new Koa()
app.use(bodyParser())

const singleNotifications = new Map()
const sequences = new Map()

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.post('/notifications/:path', async ctx => {
  const path = ctx.params.path
  console.log(`POST on /notifications/${path} received by notification receiver.`)
  singleNotifications.set(path, ctx.request.body)
  ctx.status = 201
})

router.get('/notifications/:path', async ctx => {
  const path = ctx.params.path
  console.log(`GET on /notifications/${path} received by notification receiver.`)
  const notification = singleNotifications.get(path)
  if(!notification) {
    ctx.throw(404, `No notification has been stored on /notifications/${path}.`)
  } else {
    ctx.body = notification
    ctx.type = 'application/json'
    ctx.status = 200
  }
})

router.post('/sequences/:path', async ctx => {
  const path = ctx.params.path
  console.log(`POST on /sequences/${path} received by notification receiver.`)
  const sequence = sequences.get(path)
  if(!sequence) {
    sequences.set(path, [ctx.request.body])
  } else {
    sequence.push(ctx.request.body)
  }
  ctx.status = 201
})

router.get('/sequences/:path', async ctx => {
  const path = ctx.params.path
  console.log(`GET on /sequences/${path} received by notification receiver.`)
  const sequence = sequences.get(path)
  if(!sequence) {
    ctx.throw(404, `No notifications have been stored on /sequences/${path}.`)
  } else {
    ctx.body = sequence
    ctx.type = 'application/json'
    ctx.status = 200
  }
})

app.use(router.routes())

const server = app.listen(PORT, () => console.log('Starting mock receiver server on port ' + PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Storage-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
