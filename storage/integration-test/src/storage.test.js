const waitOn = require('wait-on')
const request = require('supertest')
const AMQP = require('amqplib')

const STORAGE_URL = process.env.STORAGE_API
const STORAGEMQ_URL = process.env.STORAGEMQ_API
const AMQP_URL = process.env.AMQP_URL

const amqp_exchange = "ods_global"
const amqp_pipeline_config_created_topic = "pipeline.config.created"
const amqp_pipeline_execution_success_topic = "pipeline.execution.success"

let amqpConnection = undefined

describe('Storage', () => {
  console.log('Storage-Service URL= ' + STORAGE_URL)

  beforeAll(async () => {
    try {
      const promiseResults = await Promise.all([
        amqpConnect(AMQP_URL, 40, 2000),
        waitOn({ resources: [STORAGE_URL, `${STORAGEMQ_URL}/`], timeout: 80000, log: true })
      ])
      amqpConnection = promiseResults[0]
    } catch (err) {
      process.exit(1)
    }
  }, 90000)

  test('GET on arrived data', async () => {
    const pipelineId = "21398"

    const channel = await amqpConnection.createChannel()
    channel.assertExchange(amqp_exchange, 'topic', {
        durable: false
    });

    const pipelineCreatedEvent = {
      pipelineId: pipelineId
    }
    const configEvent = JSON.stringify(pipelineCreatedEvent)

    channel.publish(amqp_exchange, amqp_pipeline_config_created_topic, Buffer.from(configEvent))
    console.log("Sent via AMQP: %s:'%s'", amqp_pipeline_config_created_topic, configEvent);

    await sleep(1000) // time to process event


    const pipelineExecutedEvent = {
      pipelineId: pipelineId,
      timestamp: new Date(Date.now()),
      data: { exampleNumber: 123, exampleString: "abc", exampleArray: [{x: "y"}, {t: 456}]}
    }
    const executionEvent = JSON.stringify(pipelineExecutedEvent)

    channel.publish(amqp_exchange, amqp_pipeline_execution_success_topic, Buffer.from(executionEvent))
    console.log("Sent via AMQP: %s:'%s'", amqp_pipeline_execution_success_topic, executionEvent);

    await sleep(1000) // time to process event


    const response = await request(STORAGE_URL)
      .get(`/${pipelineId}`)
    console.log(response.body)
    expect(response.status).toEqual(200)
    expect(response.body).toHaveLength(1)
    expect(response.type).toEqual('application/json')
    expect(response.body[0].id).toEqual(1)
    expect(new Date(response.body[0].timestamp)).toEqual(new Date(pipelineExecutedEvent.timestamp)) // TODO: returned timestamp is not ISO String, but equal
    expect(response.body[0].pipelineId).toEqual(pipelineExecutedEvent.pipelineId)
    expect(response.body[0].data).toEqual(pipelineExecutedEvent.data)
  }, 10000)
})

const amqpConnect = async (amqpUrl, retries, backoff) => {
  console.log("AMQP URL: " + amqpUrl)
  for (let i = 1; i <= retries; i++) {
    try {
      const connection = await AMQP.connect(amqpUrl)
      console.log(`Successfully establish connection to AMQP broker (${amqpUrl})`)
      return Promise.resolve(connection)
    } catch(error) {
      console.info(`Error connecting to RabbitMQ: ${error}. Retrying in ${backoff} seconds`)
      console.info(`Connecting to Amqp broker (${i}/${retries})`);
      await sleep(backoff)
      continue
    }
  }
  Promise.reject(`Could not establish connection to AMQP broker (${amqpUrl})`)
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
