const Koa = require('koa')
const Router = require('koa-router')
const router = new Router()
const app = new Koa()
const PORT = process.env.MOCK_ADAPTER_PORT || 8082

const dataImportResponse = {
  id: 1,
  location: '/data/1'
}

const importedData = {
  field1: 'abc',
  field2: 123,
  field3: {
    name: 'simpleObject'
  },
  field4: [3, 5, 'a', 'z']
}

router.get('/', async ctx => {
  ctx.type = 'text/plain'
  ctx.body = 'ok'
})

router.post('/dataImport', async ctx => {
  ctx.type = 'text/json'
  ctx.body = dataImportResponse
})

router.get('/data/1', async  ctx => {
  ctx.type = 'text/json'
  ctx.body = importedData
})

app.use(router.routes())

const server = app.listen(PORT, () => console.log('Starting mock adapter server on port ' + PORT))

process.on('SIGTERM', async () => {
  console.info('Mock-Adapter-Server: SIGTERM signal received.')
  await server.close()
})

module.exports = server
