/* eslint-env jest */
// @ts-check
const request = require('supertest')
const waitOn = require('wait-on')
const amqp = require('amqplib')

const URL = process.env.TRANSFORMATION_API || 'http://localhost:8080'

const AMQP_URL = process.env.AMQP_URL
const AMQP_EXCHANGE = process.env.AMQP_EXCHANGE
const AMQP_IT_QUEUE = process.env.AMQP_IT_QUEUE
const AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC = process.env.AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC
const AMQP_PIPELINE_EXECUTION_ERROR_TOPIC = process.env.AMQP_PIPELINE_EXECUTION_ERROR_TOPIC
const AMQP_IMPORT_SUCCESS_TOPIC = process.env.AMQP_IMPORT_SUCCESS_TOPIC

let amqpConnection
const publishedEvents = new Map() // routing key -> received msgs []

describe('Transformation Service', () => {
  console.log('Transformation-Service URL= ' + URL)

  beforeAll(async () => {
    const pingUrl = URL + '/'
    console.log('Waiting for transformation-service with URL: ' + pingUrl)
    await waitOn({ resources: [pingUrl], timeout: 50000 })
    await connectAmqp(AMQP_URL)

    await receiveAmqp(AMQP_URL, AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC, AMQP_IT_QUEUE)
    await receiveAmqp(AMQP_URL, AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_ERROR_TOPIC, AMQP_IT_QUEUE)
  }, 60000)

  afterAll(async () => {
    if (amqpConnection) {
      console.log('Closing AMQP Connection...')
      await amqpConnection.close()
      console.log('AMQP Connection closed')
    }

    // clear stored configs
    await request(URL)
      .delete('/configs')
      .send()
  })

  test('Pipeline runs through successfully with successful publish', async () => {
    const pipelineConfig = {
      datasourceId: 12345,
      transformation: {
        func: 'return data.a + data.b;'
      },
      metadata: {
        author: 'icke',
        license: 'none',
        displayName: 'test pipeline 1',
        description: 'integraiton testing pipeline'
      }
    }
    // create pipeline to persist
    const creationResponse = await request(URL)
      .post('/configs')
      .send(pipelineConfig)
    expect(creationResponse.status).toEqual(201)
    const configId = creationResponse.body.id

    const trigger = {
      datasourceId: pipelineConfig.datasourceId,
      data: {
        a: 'abc',
        b: 123
      }
    }

    const response = await request(URL)
      .post('/trigger')
      .send(trigger)
    expect(response.status).toEqual(200)

    await sleep(10000) // pipeline should have been executing until now!
    expect(publishedEvents.get(AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC)).toContainEqual(
      {
        pipelineId: configId,
        pipelineName: pipelineConfig.metadata.displayName,
        data: trigger.data.a + trigger.data.b
      })
  }, 12000)

  test('Pipeline runs through with error with successful publish', async () => {
    const pipelineConfig = {
      datasourceId: 12346,
      transformation: {
        func: 'return asd.def;'
      },
      metadata: {
        author: 'icke',
        license: 'none',
        displayName: 'test pipeline 2',
        description: 'integraiton testing pipeline'
      }
    }
    // create pipeline to persist
    const creationResponse = await request(URL)
      .post('/configs')
      .send(pipelineConfig)
    expect(creationResponse.status).toEqual(201)
    const configId = creationResponse.body.id

    const trigger = {
      datasourceId: pipelineConfig.datasourceId,
      data: {
        a: 'abc',
        b: 123
      }
    }
    const response = await request(URL)
      .post('/trigger')
      .send(trigger)
    expect(response.status).toEqual(200)

    await sleep(10000) // pipeline should have been executing until now!
    expect(publishedEvents.get(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)).toBeDefined()
    expect(publishedEvents.get(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)).toHaveLength(1)
    expect(publishedEvents.get(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)[0].pipelineId).toEqual(configId)
    expect(publishedEvents.get(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)[0].pipelineName).toEqual(pipelineConfig.metadata.displayName)
    expect(publishedEvents.get(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)[0].error).toBeDefined()
  }, 12000)

  test('Event Driven Trigger', async () => {
    const pipelineConfig = {
      datasourceId: 12345,
      transformation: {
        func: 'return data.a + data.b;'
      },
      metadata: {
        author: 'icke',
        license: 'none',
        displayName: 'test pipeline 1',
        description: 'integraiton testing pipeline'
      }
    }
    // create pipeline to persist
    const creationResponse = await request(URL)
      .post('/configs')
      .send(pipelineConfig)
    expect(creationResponse.status).toEqual(201)
    const configId = creationResponse.body.id

    const channel = await amqpConnection.createChannel()
    channel.assertExchange(AMQP_EXCHANGE, 'topic')

    const importSuccessEvent = {
      datasourceId: 12345,
      data: {
        a: 1,
        b: 2
      }
    }
    channel.publish(AMQP_EXCHANGE, AMQP_IMPORT_SUCCESS_TOPIC, Buffer.from(importSuccessEvent))
    console.log("Sent via AMQP: %s:'%s'", AMQP_IMPORT_SUCCESS_TOPIC, importSuccessEvent)

    await sleep(10000) // pipeline should have been executing until now!
    expect(publishedEvents.get(AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC)).toContainEqual(
      {
        pipelineId: configId,
        pipelineName: pipelineConfig.metadata.displayName,
        data: importSuccessEvent.data.a + importSuccessEvent.data.b
      })
  })
})

async function connectAmqp (url) {
  amqpConnection = await amqp.connect(url)
  console.log(`Connected to AMQP on host "${url}"`)
}

async function receiveAmqp (url, exchange, topic, queue) {
  const channel = await amqpConnection.createChannel()
  const q = await channel.assertQueue(queue)
  await channel.bindQueue(q.queue, exchange, topic)

  console.log(`Listening on AMQP host "${url}" on exchange "${exchange}" for topic "${topic}"`)

  await channel.consume(q.queue, async (msg) => {
    const event = JSON.parse(msg.content.toString())
    console.log(`Event received via amqp: ${JSON.stringify(event)}`)
    const routingKey = msg.fields.routingKey
    if (!publishedEvents.get(routingKey)) {
      publishedEvents.set(routingKey, [])
    }
    publishedEvents.get(routingKey).push(event)
  })
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
