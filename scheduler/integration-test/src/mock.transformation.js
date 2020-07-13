const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const axios = require('axios').default
const router = new Router()

const PORT = process.env.MOCK_TRANSFORMATION_PORT || 8083

const app = new Koa()
app.use(bodyParser())

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.post('/job', async ctx => {
  ctx.type = 'text/json'
  const dataLocation = ctx.request.body.dataLocation;
  const fetchResponse = await axios.get(dataLocation)
  let importedData = fetchResponse.data
  importedData.test = 'abc'
  ctx.body = { data: importedData }
})

app.use(router.routes())

const server = app.listen(PORT, () => console.log('Starting mock transformation server on port ' + PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Transformation-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
