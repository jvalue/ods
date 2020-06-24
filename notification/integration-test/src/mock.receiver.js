const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')

const PORT = process.env.MOCK_RECEIVER_PORT || 8081

const router = new Router()
const app = new Koa()
app.use(bodyParser())



const pipelineMap = new Map() // contains maps with config for correspondig pipeline id


router.get('/', async ctx => {
    ctx.type = 'text/plain'
    ctx.body = 'ok'
})


/*==================================================================
 *  Mock for Config Requests (for specific pipeline)
 *=================================================================*/
router.get("/config/pipeline/:pipelineId", async(ctx) => {
    const pipelineId = ctx.params.pipelineId;
    const configMap = pipelineMap.get(pipelineId)
})

/*==================================================================
 *  Mock for Config persistence
 *=================================================================*/
router.post('/config/:configType', async ctx => {
    const configType = ctx.params.configType
    let notificationConfigs = new Map() // Map of notification Configs for CRUD Operations (key: config type, value: list of configs)

    const config = ctx.request.body
    const pipelineId = config.pipelienId

    if (!config || !pipelineId) {
        ctx.status = 400
        ctx.type = 'application/json'
        ctx.body = 'Malformed config request.'
        return
    }

    notificationConfigs.set(configType, config)
    pipelineMap.set(pipelineId, notificationConfigs)

    ctx.status = 200
    ctx.type = 'application/json'
    ctx.body(config)
})

router.get('/:path', async ctx => {
    const path = ctx.params.path
    const notification = notifications.get(path)
    if (!notification) {
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

router.get('/slack/*', async ctx => {
    const notification = notifications.get('slack')
    if (!notification) {
        ctx.throw(404)
    } else {
        ctx.body = notification
        ctx.type = 'application/json'
        ctx.status = 200
    }
})

router.post('/slack/*', async ctx => {
    console.log('Slack notification triggered.')
    notifications.set('slack', ctx.request.body)
    ctx.status = 201
})

app.use(router.routes())

const server = app.listen(PORT, () => console.log(`Starting mock notification receiver on port ${PORT}`))

process.on('SIGTERM', async() => {
    console.info('Mock-Notification-Receiver: SIGTERM signal received.')
    await server.close()
})

module.exports = server