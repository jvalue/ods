/* eslint-env jest */
// @ts-check
const request = require('supertest')
const waitOn = require('wait-on')
const amqp = require('amqplib')

const URL = process.env.ADAPTER_API || 'http://localhost:9000/api/adapter'

const AMQP_URL = process.env.AMQP_URL
const AMQP_EXCHANGE = process.env.AMQP_EXCHANGE
const AMQP_IT_QUEUE = process.env.AMQP_IT_QUEUE
const MOCK_SERVER_PORT = process.env.MOCK_SERVER_PORT || 8081
const MOCK_SERVER_HOST = process.env.MOCK_SERVER_HOST || 'localhost'
const MOCK_SERVER_URL = 'http://' + MOCK_SERVER_HOST + ':' + MOCK_SERVER_PORT
const datasourceExecutionSuccessTopic = process.env.AMQP_IMPORT_SUCCESS_TOPIC

let amqpConnection
const publishedEvents = new Map() // routing key -> received msgs []

describe('Adapter Sources Trigger', () => {
  beforeAll(async () => {
    console.log('Starting adapter sources trigger test')
    const pingUrl = URL + '/version'
    console.log(`Waiting for services: ${MOCK_SERVER_URL} and ${pingUrl}`)
    await waitOn({ resources: [MOCK_SERVER_URL, pingUrl], timeout: 50000 })
    console.log(`Services available. Connecting to amqp at ${AMQP_URL} ...`)
    await connectAmqp(AMQP_URL)

    await receiveAmqp(AMQP_URL, AMQP_EXCHANGE, datasourceExecutionSuccessTopic, AMQP_IT_QUEUE)
    console.log('Amqp connection established')
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

  test('POST datasources/{id}/trigger dynamic', async () => {
    const datasourceResponse = await request(URL)
      .post('/datasources')
      .send(dynamicDatasourceConfig)
    const datasourceId = datasourceResponse.body.id

    const dataMetaData = await request(URL)
      .post(`/datasources/${datasourceId}/trigger`)
      .send(runtimeParameters)

    const id = dataMetaData.body.id
    const data = await request(URL)
      .get(`/data/${id}`)
      .send()

    const delResponse = await request(URL)
      .delete('/datasources/')
      .send()

    expect(delResponse.status).toEqual(204)
    expect(datasourceResponse.status).toEqual(201)
    expect(dataMetaData.status).toEqual(200)
    expect(dataMetaData.body.id).toBeGreaterThanOrEqual(0)
    expect(dataMetaData.body.location).toEqual(`/data/${id}`)
    expect(data.status).toEqual(200)
    expect(data.body.id).toBe(runtimeParameters.parameters.id)
  })

  test('POST datasources/{id}/trigger dynamic defaultvalues', async () => {
    const datasourceResponse = await request(URL)
      .post('/datasources')
      .send(dynamicDatasourceConfig)
    const datasourceId = datasourceResponse.body.id

    const dataMetaData = await request(URL)
      .post(`/datasources/${datasourceId}/trigger`)
      .send(null)

    const id = dataMetaData.body.id
    const data = await request(URL)
      .get(`/data/${id}`)
      .send()

    const delResponse = await request(URL)
      .delete('/datasources/')
      .send()

    expect(delResponse.status).toEqual(204)
    expect(datasourceResponse.status).toEqual(201)
    expect(dataMetaData.status).toEqual(200)
    expect(dataMetaData.body.id).toBeGreaterThanOrEqual(0)
    expect(dataMetaData.body.location).toEqual(`/data/${id}`)
    expect(data.status).toEqual(200)
    expect(data.body.id).toBe(dynamicDatasourceConfig.protocol.parameters.defaultParameters.id)
  })

  test('POST datasources/{id}/trigger static', async () => {
    const datasourceResponse = await request(URL)
      .post('/datasources')
      .send(staticDatasourceConfig)
    const datasourceId = datasourceResponse.body.id

    const dataMetaData = await request(URL)
      .post(`/datasources/${datasourceId}/trigger`)
      .send(null)

    const id = dataMetaData.body.id
    const normalData = await request(URL)
      .get(`/data/${id}`)
      .send()

    const delResponse = await request(URL)
      .delete('/datasources/')
      .send()

    expect(delResponse.status).toEqual(204)
    expect(dataMetaData.status).toEqual(200)
    expect(dataMetaData.body.id).toBeGreaterThanOrEqual(0)
    expect(dataMetaData.body.location).toEqual(`/data/${id}`)
    expect(normalData.status).toEqual(200)
    expect(normalData.body.id).toBe('1')
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

const dynamicDatasourceConfig = {
  id: 54321,
  protocol: {
    type: 'HTTP',
    parameters: {
      location: MOCK_SERVER_URL + '/json/{id}',
      encoding: 'UTF-8',
      defaultParameters: {
        id: '1',
        userId: '2'
      }
    }
  },
  format: {
    type: 'JSON',
    parameters: {}
  },
  trigger: {
    firstExecution: '1905-12-01T02:30:00.123Z',
    periodic: false,
    interval: 50000
  },
  metadata: {
    author: 'icke',
    license: 'none',
    displayName: 'test datasource 2',
    description: 'integration testing dynamic datasources'
  }
}

const staticDatasourceConfig = {
  id: -1,
  protocol: {
    type: 'HTTP',
    parameters: {
      location: MOCK_SERVER_URL + '/json/1',
      encoding: 'UTF-8'
    }
  },
  format: {
    type: 'JSON',
    parameters: {}
  },
  trigger: {
    firstExecution: '1905-12-01T02:30:00.123Z',
    periodic: false,
    interval: 50000
  },
  metadata: {
    author: 'icke',
    license: 'none',
    displayName: 'test datasource 2',
    description: 'integration testing dynamic datasources'
  }
}

const runtimeParameters = {
  parameters: {
    id: '2'
  }
}
