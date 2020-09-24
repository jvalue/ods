const waitOn = require('wait-on')
const request = require('supertest')
const AMQP = require('amqplib')

const URL = process.env.STORAGEMQ_API
const AMQP_URL = process.env.AMQP_URL

const AMQP_EXCHANGE = 'ods_global'
const AMQP_PIPELINE_CONFIG_CREATED_TOPIC = 'pipeline.config.created'
const AMQP_PIPELINE_CONFIG_DELETED_TOPIC = 'pipeline.config.deleted'
const AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC = 'pipeline.execution.success'

let amqpConnection

describe('Storage-MQ', () => {
  beforeAll(async () => {
    console.log('Waiting on all dependent services before starting to test')
    const pingUrl = URL + '/'

    const promiseResults = await Promise.all([
      amqpConnect(AMQP_URL, 40, 2000),
      storageMqHealth(pingUrl, 80000)
    ])
    amqpConnection = promiseResults[0]
  }, 90000)

  afterAll(async () => {
    if (amqpConnection) {
      await amqpConnection.close()
    }
  }, 10000)

  test('GET /version', async () => {
    const response = await request(URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')
    const semanticVersionRegEx = '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionRegEx))
  }, 5000)

  test('GET /bucket/3000/content on non-existing bucket should 404', async () => {
    const response = await request(URL).get('/bucket/3000/content')
    console.log(response.body)
    expect(response.status).toEqual(404)
  }, 5000)

  test('GET /bucket/3000/content/5 on non-existing bucket should 404', async () => {
    const response = await request(URL).get('/bucket/3000/content/5')
    console.log(response.body)
    expect(response.status).toEqual(404)
  }, 5000)

  test('Event-driven storage structure creation and no content', async () => {
    const pipelineId = '333'

    const channel = await amqpConnection.createChannel()
    channel.assertExchange(AMQP_EXCHANGE, 'topic', {
      durable: true
    })

    const pipelineCreatedEvent = {
      pipelineId: pipelineId
    }
    const event = JSON.stringify(pipelineCreatedEvent)

    channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_CREATED_TOPIC, Buffer.from(event))
    console.log("Sent via AMQP: %s:'%s'", AMQP_PIPELINE_CONFIG_CREATED_TOPIC, event)

    await sleep(2000) // time to process event

    const response = await request(URL).get(`/bucket/${pipelineId}/content/`)
    console.log(response.body)
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body).toEqual([])
  }, 10000)

  test('Event-driven storage structure creation and content arrival', async () => {
    const pipelineId = '444'

    const channel = await amqpConnection.createChannel()
    channel.assertExchange(AMQP_EXCHANGE, 'topic', {
      durable: true
    })

    const pipelineCreatedEvent = {
      pipelineId: pipelineId
    }
    const configEvent = JSON.stringify(pipelineCreatedEvent)

    channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_CREATED_TOPIC, Buffer.from(configEvent))
    console.log("Sent via AMQP: %s:'%s'", AMQP_PIPELINE_CONFIG_CREATED_TOPIC, configEvent)

    await sleep(1000) // time to process event

    const pipelineExecutedEvent = {
      pipelineId: pipelineId,
      timestamp: new Date(Date.now()),
      data: { exampleNumber: 123, exampleString: 'abc', exampleArray: [{ x: 'y' }, { t: 456 }] }
    }
    const executionEvent = JSON.stringify(pipelineExecutedEvent)

    channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC, Buffer.from(executionEvent))
    console.log("Sent via AMQP: %s:'%s'", AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC, executionEvent)

    await sleep(1000) // time to process event

    const contentResponse = await request(URL).get(`/bucket/${pipelineId}/content/1`)
    expect(contentResponse.status).toEqual(200)
    expect(contentResponse.type).toEqual('application/json')
    expect(contentResponse.body.id).toEqual(1)
    expect(contentResponse.body.timestamp).toEqual(pipelineExecutedEvent.timestamp.toISOString())
    expect(contentResponse.body.pipelineId).toEqual(pipelineExecutedEvent.pipelineId)
    expect(contentResponse.body.data).toEqual(pipelineExecutedEvent.data)

    const allContentResponse = await request(URL).get(`/bucket/${pipelineId}/content`)
    expect(allContentResponse.status).toEqual(200)
    expect(allContentResponse.type).toEqual('application/json')
    expect(allContentResponse.body).toHaveLength(1)
    expect(allContentResponse.body[0]).toEqual(contentResponse.body)
  }, 10000)

  test('GET /bucket/3000/content/5 on existing bucket but not existing content should 404', async () => {
    const response = await request(URL).get('/bucket/3000/content/5')
    expect(response.status).toEqual(404)
  }, 5000)

  test('Event-driven storage structure creation and deletion', async () => {
    const pipelineId = '555'

    const channel = await amqpConnection.createChannel()
    channel.assertExchange(AMQP_EXCHANGE, 'topic', {
      durable: true
    })

    // create
    const pipelineCreatedEvent = {
      pipelineId: pipelineId
    }
    const createdEvent = JSON.stringify(pipelineCreatedEvent)

    channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_CREATED_TOPIC, Buffer.from(createdEvent))
    console.log("Sent via AMQP: %s:'%s'", AMQP_PIPELINE_CONFIG_CREATED_TOPIC, createdEvent)

    await sleep(1000) // time to process event

    // delete
    const pipelineDeletedEvent = {
      pipelineId: pipelineId
    }
    const deletedEvent = JSON.stringify(pipelineDeletedEvent)

    channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_DELETED_TOPIC, Buffer.from(deletedEvent))
    console.log("Sent via AMQP: %s:'%s'", AMQP_PIPELINE_CONFIG_DELETED_TOPIC, deletedEvent)

    await sleep(1000) // time to process event

    // content gone again
    const response = await request(URL).get(`/bucket/${pipelineId}/content/`)
    expect(response.status).toEqual(404)
  })
}, 10000)

const storageMqHealth = async (pingUrl, timeout) => {
  console.log('Storage-MQ URL= ' + URL)
  return await waitOn({ resources: [pingUrl], timeout: timeout, log: true })
}

const amqpConnect = async (amqpUrl, retries, backoff) => {
  console.log('AMQP URL: ' + amqpUrl)
  for (let i = 1; i <= retries; i++) {
    try {
      const connection = await AMQP.connect(amqpUrl)
      console.log(`Successfully establish connection to AMQP broker (${amqpUrl})`)
      return connection
    } catch (error) {
      console.info(`Error connecting to RabbitMQ: ${error}. Retrying in ${backoff} seconds`)
      console.info(`Connecting to Amqp broker (${i}/${retries})`)
      await sleep(backoff)
    }
  }
  throw new Error(`Could not establish connection to AMQP broker (${amqpUrl})`)
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
