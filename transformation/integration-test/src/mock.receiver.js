const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')

const PORT = process.env.MOCK_RECEIVER_PORT || 8081

const router = new Router()
const app = new Koa()
app.use(bodyParser())

let adapterDataMap = new Map()
let requestedMap = new Map();

router.get('/', async ctx => {
    ctx.type = 'text/plain'
    ctx.body = 'ok'
})


// Endpoint to respond with adapter data
router.get("/adapter/:id", async(ctx) => {
    const adapterId = ctx.params.id;
    const adapterData = adapterDataMap.get(adapterId);

    if (!adapterData) {
        ctx.throw(400);
    } else {
        ctx.body = adapterData;
        ctx.type = "application/json";
        ctx.status = 200;
    }
});


// Endpoint to test wheter transformation sends a request
router.get('/ping/:id', async ctx => {
    const requestedId = ctx.params.id;
    requested = requestedMap.set(requestedId, true)

    ctx.body = { "one": 1, "two": 2 }
    ctx.type = 'application/json'
    ctx.status = 200
})

// Endpoint to test wheter transformation sends a request
router.get('/pong/:id', async ctx => {
    const requestedId = ctx.params.id

    const requested = requestedMap.get(requestedId);


    if (!requested) {
        requestedMap.set(requestedId, false);
        ctx.throw(400)
    } else {
        requestedMap.set(requestedId, false);
        ctx.status = 200
    }
})


// Endpoint for testing purposes (can persist adapterdata for retrieval later on)
router.post('/adapter/:id', async ctx => {
    const id = ctx.params.id
    adapterDataMap.set(id, JSON.stringify(ctx.request.body))
    ctx.status = 200
})


app.use(router.routes())

const server = app.listen(PORT, () => console.log(`Starting mock adapter receiver on port ${PORT}`))

process.on('SIGTERM', async() => {
    console.info('Mock-Adapter-Receiver: SIGTERM signal received.')
    await server.close()
})

module.exports = server