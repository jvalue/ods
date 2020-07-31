/* eslint-env jest */
const request = require('supertest')
const waitOn = require('wait-on')
const amqp = require('amqplib')

const URL = process.env.TRANSFORMATION_API || 'http://localhost:8080'

const AMQP_URL = process.env.AMQP_URL
const AMQP_EXCHANGE = process.env.AMQP_EXCHANGE
const AMQP_IT_QUEUE = process.env.AMQP_IT_QUEUE
const AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC = process.env.AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC
const AMQP_PIPELINE_EXECUTION_ERROR_TOPIC = process.env.AMQP_PIPELINE_EXECUTION_ERROR_TOPIC


let amqpConnection
const publishedEvents = new Map()

describe('Transformation Service', () => {
  console.log('Transformation-Service URL= ' + URL)

  beforeAll(async () => {
    const pingUrl = URL + '/'
    console.log('Waiting for transformation-service with URL: ' + pingUrl)
    await waitOn({ resources: [pingUrl], timeout: 50000 })
    await connectAmqp(AMQP_URL)
  }, 60000)

  afterAll(async () => {
    if(amqpConnection) {
      console.log('Closing AMQP Connection...')
      await amqpConnection.close()
      console.log('AMQP Connection closed')
    }
  })

  test('Pipeline runs through successfully with successful publish', async () => {
    const testName = "test1"

    const trigger = {
      pipelineId: 125,
      pipelineName: 'nordstream',
      func: 'return data;',
      data: {
        a: 'abc',
        b: 123
      }
    }

    const response = await request(URL)
      .post('/config/125/trigger')
      .send(trigger)
    expect(response.status).toEqual(200)


    await receiveAmqp(AMQP_URL, AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC, AMQP_IT_QUEUE, testName)
    await sleep(10000) // pipeline should have been executing until now!
    expect(publishedEvents.get(testName)).toContainEqual(
      {
        pipelineId: trigger.pipelineId,
        pipelineName: trigger.pipelineName,
        data: trigger.data
      })
  }, 12000)


  test('Pipeline runs through with error with successful publish', async () => {
    const testName = "test2"

    const trigger = {
      pipelineId: 125,
      pipelineName: 'nordstream',
      func: 'return asd.dde;',
      data: {
        a: 'abc',
        b: 123
      }
    }

    const response = await request(URL)
      .post('/config/125/trigger')
      .send(trigger)
    expect(response.status).toEqual(200)


    await receiveAmqp(AMQP_URL, AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_ERROR_TOPIC, AMQP_IT_QUEUE, testName)
    await sleep(10000) // pipeline should have been executing until now!
    expect(publishedEvents.get(testName)).toBeDefined()
    expect(publishedEvents.get(testName).length).toEqual(1)
    expect(publishedEvents.get(testName).pipelineId).toEqual(trigger.pipelineId)
    expect(publishedEvents.get(testName).pipelineName).toEqual(trigger.pipelineName)
    expect(publishedEvents.get(testName).error).toBeDefined()
  }, 12000)

})

async function connectAmqp (url) {
  amqpConnection = await amqp.connect(url)
  console.log(`Connected to AMQP on host "${url}"`)
}

async function receiveAmqp (url, exchange, topic, queue, testName) {
  const channel = await amqpConnection.createChannel()
  const q = await channel.assertQueue(queue)
  await channel.bindQueue(q.queue, exchange, topic)

  console.log(`Listening on AMQP host "${url}" on exchange "${exchange}" for topic "${topic}"`)

  const testName2 = testName
  await channel.consume(q.queue, async (msg) => {
    console.log(`debug: ${testName}`)
    console.log(`debug: ${this.testName}`)
    console.log(`debug: ${testName2}`)
    console.log(`debug: ${this.testName2}`)
    const event = JSON.parse(msg.content.toString())
    console.log(`Event received via amqp: ${JSON.stringify(event)}`)
    if(!publishedEvents.get(testName)) {
      publishedEvents.set(testName, [])
    }
    publishedEvents.get(testName).push(event)
    console.log(`Received the following events on this testname "${testName}": ${JSON.stringify(publishedEvents.get(testName))}`)
  })
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
