const waitOn = require('wait-on')
const AMQP = require('amqplib')

const URL = process.env.STORAGEMQ_API
const AMQP_URL = process.env.AMQP_URL

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
    expect(true).toBeTruthy()
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
