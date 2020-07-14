const waitOn = require('wait-on')
const request = require('supertest')
const AMQP = require('amqplib')

const URL = process.env.STORAGEMQ_API
const AMQP_URL = process.env.AMQP_URL
const AMQP_EXCHANGE = process.env.AMQP_EXCHANGE
const AMQP_PIPELINE_CREATED_TOPIC = process.env.AMQP_PIPELINE_CREATED_TOPIC

let amqpConnection = undefined

describe('Storage-MQ', () => {

  beforeAll(async () => {
    console.log("Waiting on all dependent services before starting to test")
    const pingUrl = URL + '/'

    const promiseResults = await Promise.allSettled([
      storageMqHealth(pingUrl, 50000),
      amqpConnect(AMQP_URL, 25, 2000)
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
      await this.sleep(backoff)
      continue
    }
  }
  Promise.reject(`Could not establish connection to AMQP broker (${amqpUrl})`)
}
