const waitOn = require('wait-on')
const request = require('supertest')
const AMQP = require('amqplib')

const URL = process.env.STORAGEMQ_API
const AMQP_URL = process.env.AMQP_URL

const amqp_exchange = "ods_global"
const amqp_pipeline_config_created_topic = "pipeline.config.created"
const amqp_pipeline_execution_success_topic = "pipeline.execution.success"

let amqpConnection = undefined

describe('Storage-MQ', () => {

  beforeAll(async () => {
    console.log("Waiting on all dependent services before starting to test")
    const pingUrl = URL + '/'

    const promiseResults = await Promise.all([
      amqpConnect(AMQP_URL, 25, 2000),
      storageMqHealth(pingUrl, 50000),
    ])
    amqpConnection = promiseResults[0]
  }, 60000)

  test('GET /version', async () => {
    const response = await request(URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')
    const semanticVersionRegEx = '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionRegEx))
  })

  test('GET /bucket/3000/content on non-existing bucket should 404', async () => {
    const response = await request(URL).get('/bucket/3000/content')
    console.log(response.body)
    expect(response.status).toEqual(404)
  })
  test('GET /bucket/3000/content/5 on non-existing bucket should 404', async () => {
    const response = await request(URL).get('/bucket/3000/content/5')
    console.log(response.body)
    expect(response.status).toEqual(404)
  })

  test('Event-driven storage structure creation and no content', async () => {

    const channel = await amqpConnection.createChannel()
    channel.assertExchange(amqp_exchange, 'topic', {
        durable: false
    });

    const pipelineCreatedEvent = {
      pipelineId: "333"
    }
    const event = JSON.stringify(pipelineCreatedEvent)

    channel.publish(amqp_exchange, amqp_pipeline_config_created_topic, Buffer.from(event))
    console.log("Sent via AMQP: %s:'%s'", amqp_pipeline_config_created_topic, event);

    await sleep(2000) // time to process event

    const response = await request(URL).get('/bucket/333/content/')
    console.log(response.body)
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/json')
    expect(response.body).toEqual([])
  })

  test('GET /bucket/3000/content/5 on existing bucket but not existing content should 404', async () => {
    const response = await request(URL).get('/bucket/3000/content/5')
    expect(response.status).toEqual(404)
  })
})



const storageMqHealth = async (pingUrl, timeout) => {
  console.log('Storage-MQ URL= ' + URL)
  return await waitOn({ resources: [pingUrl], timeout: timeout , log: true })
}

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
