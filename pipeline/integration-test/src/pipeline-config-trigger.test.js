/* eslint-env jest */
// @ts-check

const request = require('supertest')
const waitOn = require('wait-on')
const amqp = require('amqplib')

const URL = process.env.PIPELINE_API || 'http://localhost:8080'

const AMQP_URL = process.env.AMQP_URL
const AMQP_EXCHANGE = process.env.AMQP_EXCHANGE
const AMQP_IT_QUEUE = process.env.AMQP_IT_QUEUE
const AMQP_PIPELINE_EXECUTION_TOPIC = process.env.AMQP_PIPELINE_EXECUTION_TOPIC
const AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC = process.env.AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC
const AMQP_PIPELINE_EXECUTION_ERROR_TOPIC = process.env.AMQP_PIPELINE_EXECUTION_ERROR_TOPIC
const AMQP_IMPORT_SUCCESS_TOPIC = process.env.AMQP_IMPORT_SUCCESS_TOPIC
const CONNECTION_RETRIES = +process.env.CONNECTION_RETRIES
const CONNECTION_BACKOFF = +process.env.CONNECTION_BACKOFF

let amqpConnection
let channel
const publishedEvents = new Map() // routing key -> received msgs []

describe('Pipeline Service Config Trigger', () => {
  beforeAll(async () => {
    console.log('Starting config trigger tests..')
    const pingUrl = URL + '/'
    await waitOn({ resources: [pingUrl], timeout: 50000, log: true })

    try {
      await initAmqp(AMQP_URL, AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_TOPIC, AMQP_IT_QUEUE, CONNECTION_RETRIES, CONNECTION_BACKOFF)
    } catch (e) {
      console.log(`Could not initialize amqp connection: ${e.message}`)
      process.exit(1)
    }
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
        displayName: 'success test pipeline',
        description: 'integration testing pipeline'
      }
    }
    // create pipeline to persist
    const creationResponse = await request(URL)
      .post('/configs')
      .send(pipelineConfig)
    expect(creationResponse.status).toEqual(201)
    const configId = creationResponse.body.id

    const data = {
      a: 'abc',
      b: 123
    }

    const importSuccessEvent = {
      datasourceId: pipelineConfig.datasourceId,
      data: JSON.stringify(data)
    }

    channel.publish(AMQP_EXCHANGE, AMQP_IMPORT_SUCCESS_TOPIC, Buffer.from(JSON.stringify(importSuccessEvent)))

    await sleep(10000) // pipeline should have been executing until now!
    expect(publishedEvents.get(AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC)).toContainEqual(
      {
        pipelineId: configId,
        pipelineName: pipelineConfig.metadata.displayName,
        data: data.a + data.b
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
        displayName: 'error test pipeline',
        description: 'integration testing pipeline'
      }
    }
    // create pipeline to persist
    const creationResponse = await request(URL)
      .post('/configs')
      .send(pipelineConfig)
    expect(creationResponse.status).toEqual(201)
    const configId = creationResponse.body.id

    const data = {
      a: 'abc',
      b: 123
    }

    const importSuccessEvent = {
      datasourceId: pipelineConfig.datasourceId,
      data: JSON.stringify(data)
    }

    channel.publish(AMQP_EXCHANGE, AMQP_IMPORT_SUCCESS_TOPIC, Buffer.from(JSON.stringify(importSuccessEvent)))

    await sleep(10000) // pipeline should have been executing until now!
    expect(publishedEvents.get(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)).toBeDefined()
    expect(publishedEvents.get(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)).toHaveLength(1)
    expect(publishedEvents.get(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)[0].pipelineId).toEqual(configId)
    expect(publishedEvents.get(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)[0].pipelineName).toEqual(pipelineConfig.metadata.displayName)
    expect(publishedEvents.get(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)[0].error).toBeDefined()
  }, 12000)
})

async function initAmqp (url, exchange, topic, queue, retries, backoff) {
  for (let i = 1; ; i++) {
    try {
      if (!amqpConnection) {
        console.log('Connecting to amqp...')
        amqpConnection = await amqp.connect(url)
        console.log(`Connected to AMQP on host "${url}"`)
      }
      if (!channel) {
        console.log('Creating channel...')
        channel = await amqpConnection.createChannel()
      }
      await channel.assertExchange(AMQP_EXCHANGE, 'topic')

      await receiveAmqp(url, exchange, topic, queue)
      console.log('AMQP initialization successful')
      return
    } catch (e) {
      console.info(`Error initializing RabbitMQ(${i}/${retries}: ${e}.`)
      if( i <= retries ) {
        console.info(`Retrying in ${backoff}`)
        await sleep(backoff)
      } else {
        throw e
      }
    }
  }
}

async function receiveAmqp (url, exchange, topic, queue) {
  const q = await channel.assertQueue(queue)
  await channel.bindQueue(q.queue, exchange, topic)

  console.log(`Listening on AMQP host "${url}" on exchange "${exchange}" for topic "${topic}"`)

  await channel.consume(q.queue, async (msg) => {
    const event = JSON.parse(msg.content.toString())
    console.log(`Event received via amqp (${topic}): ${JSON.stringify(event)}`)
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
