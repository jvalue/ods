/* eslint-env jest */
const request = require('supertest')
const waitOn = require('wait-on')
const AMQP = require('amqplib')
const { jsonDateAfter } = require('./testHelper')

const AMQP_EXCHANGE = 'ods_global'
const AMQP_DATASOURCE_CONFIG_TOPIC = 'datasource.config.*'
const AMQP_DATASOURCE_CONFIG_CREATED_TOPIC = 'datasource.config.created'
const AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC = 'datasource.config.updated'
const AMQP_DATASOURCE_CONFIG_DELETED_TOPIC = 'datasource.config.deleted'

let amqpConnection

const {
  SCHEDULER_URL,
  AMQP_URL,
  AMQP_CONNECTION_RETRIES,
  AMQP_CONNECTION_BACKOFF,
  MOCK_SERVER_URL
} = require('./env')

const TIMEOUT = 10000

describe('Scheduler-IT', () => {
  beforeAll(async () => {
    logConfigs()
    try {
      const promiseResults = await Promise.all([
        amqpConnect(AMQP_URL, AMQP_CONNECTION_RETRIES, AMQP_CONNECTION_BACKOFF),
        waitOn({ resources: [`${SCHEDULER_URL}/`], timeout: 50000, log: false })
      ])
      amqpConnection = promiseResults[0]
    } catch (err) {
      throw new Error(`Error during setup of tests: ${err}`)
    }
  }, 60000)

  afterAll(async () => {
    if (amqpConnection) {
      await amqpConnection.close()
    }
  }, TIMEOUT)

  test('Should respond with semantic version [GET /version]', async () => {
    const response = await request(SCHEDULER_URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')
    const semanticVersionRegEx = '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionRegEx))
  }, TIMEOUT)

  test('Should initialize schedule jobs correctly', async () => {
    await sleep(4000)

    const singleTrigger = await request(MOCK_SERVER_URL)
      .get('/triggerRequests/100')

    const multipleTrigger = await request(MOCK_SERVER_URL)
      .get('/triggerRequests/101')

    expect(singleTrigger.text).toBe(1)
    expect(multipleTrigger.text).toBeGreaterThan(1)
  }, TIMEOUT)

  test('Should trigger datasource after creation event', async () => {
    const channel = await createAmqpChannel()

    const creationEvent = createDatasourceEvent(1, 2000, 0)

    channel.publish(AMQP_EXCHANGE, AMQP_DATASOURCE_CONFIG_CREATED_TOPIC, creationEvent)

    await sleep(3000)

    const triggerRequests = await request(MOCK_SERVER_URL)
      .get('/triggerRequests/1')

    expect(triggerRequests.body).toBe(1)
  }, TIMEOUT)

  test('Should not trigger datasource after deletion event', async () => {
    const channel = await createAmqpChannel()

    const creationEvent = createDatasourceEvent(2, 2000, 1000)
    const deletionEvent = createDeletionEvent(2)

    channel.publish(AMQP_EXCHANGE, AMQP_DATASOURCE_CONFIG_CREATED_TOPIC, creationEvent)
    channel.publish(AMQP_EXCHANGE, AMQP_DATASOURCE_CONFIG_DELETED_TOPIC, deletionEvent)

    await sleep(3000)

    const triggerRequests = await request(MOCK_SERVER_URL)
      .get('/triggerRequests/2')

    expect(triggerRequests.body).toBe(0)
  }, TIMEOUT)

  test('Should update trigger after update event', async () => {
    const channel = await createAmqpChannel()

    const creationEvent = createDatasourceEvent(3, 2000, 0)
    const updateEvent = createDatasourceEvent(3, 1000, 1000)

    channel.publish(AMQP_EXCHANGE, AMQP_DATASOURCE_CONFIG_CREATED_TOPIC, creationEvent)
    channel.publish(AMQP_EXCHANGE, AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC, updateEvent)

    await sleep(4000)

    const triggerRequests = await request(MOCK_SERVER_URL)
      .get('/trigger/requests/3')

    expect(triggerRequests.body).toBeGreaterThan(1)
  }, TIMEOUT)
})

function createDeletionEvent (datasourceId) {
  return Buffer.from(JSON.stringify({
    datasourceId
  }))
}

function createDatasourceEvent (datasourceId, delay, interval) {
  const periodic = (delay === 0)
  const event = {
    datasourceId,
    trigger: {
      firstExecution: jsonDateAfter(delay),
      periodic,
      interval
    }
  }
  return Buffer.from(JSON.stringify(event))
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const amqpConnect = async (amqpUrl, retries, backoff) => {
  for (let i = 1; i <= retries; i++) {
    console.info(`Connecting to AMQP broker (${i}/${retries})`)
    try {
      const connection = await AMQP.connect(amqpUrl)
      console.log('Successfully established connection to AMQP broker.')
      return connection
    } catch (error) {
      console.info(`Error connecting to AMQP broker: ${error}. Retrying in ${backoff} seconds`)
      await sleep(backoff)
    }
  }
  throw new Error('Could not establish connection to AMQP broker')
}

const createAmqpChannel = async () => {
  const channel = await amqpConnection.createChannel()
  await channel.assertExchange(AMQP_EXCHANGE, 'topic', { durable: true })
  return channel
}

const logConfigs = () => {
  const msg = `
  AMQP_EXCHANGE: ${AMQP_EXCHANGE}
  AMQP_DATASOURCE_CONFIG_TOPIC: ${AMQP_DATASOURCE_CONFIG_TOPIC}
  AMQP_DATASOURCE_CONFIG_CREATED_TOPIC: ${AMQP_DATASOURCE_CONFIG_CREATED_TOPIC}
  AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC: ${AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC}
  AMQP_DATASOURCE_CONFIG_DELETED_TOPIC: ${AMQP_DATASOURCE_CONFIG_DELETED_TOPIC}

  [Environment Variable] SCHEDULER_URL = ${SCHEDULER_URL}
  [Environment Variable] AMQP_URL = ${AMQP_URL}
  [Environment Variable] AMQP_CONNECTION_RETRIES = ${AMQP_CONNECTION_RETRIES}
  [Environment Variable] AMQP_CONNECTION_BACKOFF = ${AMQP_CONNECTION_BACKOFF}
  `
  console.log(msg)
}
