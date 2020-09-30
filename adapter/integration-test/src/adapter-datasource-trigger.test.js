/* eslint-env jest */
// @ts-check
const request = require('supertest')

const {
  ADAPTER_URL,
  MOCK_SERVER_URL,
  AMQP_URL
} = require('./env')
const { waitForServicesToBeReady } = require('./waitForServices')
const {
  connectAmqp,
  consumeAmqpMsg
} = require('./testHelper')

const AMQP_EXCHANGE = 'ods_global'
const AMQP_IT_QUEUE = 'adapter-it'
const EXECUTION_TOPIC = 'datasource.execution.*'
const EXECUTION_SUCCESS_TOPIC = 'datasource.execution.success'
const EXECUTION_FAILED_TOPIC = 'datasource.execution.failed'

const TIMEOUT = 10000

const publishedEvents = new Map() // routing key -> received msgs []
let amqpConnection

describe('Datasource triggering', () => {
  beforeAll(async () => {
    await waitForServicesToBeReady()

    amqpConnection = await connectAmqp(AMQP_URL)

    await consumeAmqpMsg(amqpConnection, AMQP_EXCHANGE, EXECUTION_TOPIC, AMQP_IT_QUEUE, publishedEvents)
  }, 60000)

  afterAll(async () => {
    // clear stored configs
    await request(ADAPTER_URL)
      .delete('/configs')
      .send()

    if (amqpConnection) {
      await amqpConnection.close()
    }
  }, TIMEOUT)

  test('Should trigger datasources with runtime parameters [POST /datasource/{id}/trigger]', async () => {
    const datasourceResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(dynamicDatasourceConfig)
    const datasourceId = datasourceResponse.body.id

    const dataMetaData = await request(ADAPTER_URL)
      .post(`/datasources/${datasourceId}/trigger`)
      .send(runtimeParameters)

    const id = dataMetaData.body.id
    const data = await request(ADAPTER_URL)
      .get(`/data/${id}`)
      .send()

    const delResponse = await request(ADAPTER_URL)
      .delete(`/datasources/${datasourceId}`)
      .send()

    expect(delResponse.status).toEqual(204)
    expect(datasourceResponse.status).toEqual(201)
    expect(dataMetaData.status).toEqual(200)
    expect(dataMetaData.body.id).toBeGreaterThanOrEqual(0)
    expect(dataMetaData.body.location).toEqual(`/data/${id}`)
    expect(data.status).toEqual(200)
    expect(data.body.id).toBe(runtimeParameters.parameters.id)

    // check for rabbitmq notification
    expect(publishedEvents.get(EXECUTION_SUCCESS_TOPIC)).toContainEqual({
      datasourceId: datasourceId,
      data: '{"id":"2"}'
    }, TIMEOUT)
  })

  test('Should trigger datasources with default parameters [POST /datasources/{id}/trigger]', async () => {
    const datasourceResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(dynamicDatasourceConfig)
    const datasourceId = datasourceResponse.body.id

    const dataMetaData = await request(ADAPTER_URL)
      .post(`/datasources/${datasourceId}/trigger`)
      .send(null)

    const id = dataMetaData.body.id
    const data = await request(ADAPTER_URL)
      .get(`/data/${id}`)
      .send()

    const delResponse = await request(ADAPTER_URL)
      .delete(`/datasources/${datasourceId}`)
      .send()

    expect(delResponse.status).toEqual(204)
    expect(datasourceResponse.status).toEqual(201)
    expect(dataMetaData.status).toEqual(200)
    expect(dataMetaData.body.id).toBeGreaterThanOrEqual(0)
    expect(dataMetaData.body.location).toEqual(`/data/${id}`)
    expect(data.status).toEqual(200)
    expect(data.body.id).toBe(dynamicDatasourceConfig.protocol.parameters.defaultParameters.id)

    // check for rabbitmq notification
    expect(publishedEvents.get(EXECUTION_SUCCESS_TOPIC)).toContainEqual({
      datasourceId: datasourceId,
      data: '{"id":"1"}'
    })
  })

  test('Should trigger datasources without runtime parameters [POST /datasources/{id}/trigger]', async () => {
    const datasourceResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(staticDatasourceConfig)
    const datasourceId = datasourceResponse.body.id

    const dataMetaData = await request(ADAPTER_URL)
      .post(`/datasources/${datasourceId}/trigger`)
      .send(null)

    const id = dataMetaData.body.id
    const normalData = await request(ADAPTER_URL)
      .get(`/data/${id}`)
      .send()

    const delResponse = await request(ADAPTER_URL)
      .delete(`/datasources/${datasourceId}`)
      .send()

    expect(delResponse.status).toEqual(204)
    expect(dataMetaData.status).toEqual(200)
    expect(dataMetaData.body.id).toBeGreaterThanOrEqual(0)
    expect(dataMetaData.body.location).toEqual(`/data/${id}`)
    expect(normalData.status).toEqual(200)
    expect(normalData.body.id).toBe('1')

    // check for rabbitmq notification
    expect(publishedEvents.get(EXECUTION_SUCCESS_TOPIC)).toContainEqual({
      datasourceId: datasourceId,
      data: '{"id":"1"}'
    })
  })

  test('Should publish results for failing datasources [POST /datasources/{id}/trigger]', async () => {
    const brokenDatasourceConfig = Object.assign({}, staticDatasourceConfig)
    brokenDatasourceConfig.protocol.parameters.location = 'LOL'
    const datasourceResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(brokenDatasourceConfig)

    const datasourceId = datasourceResponse.body.id

    const triggerResponse = await request(ADAPTER_URL)
      .post(`/datasources/${datasourceId}/trigger`)
      .send()

    expect(triggerResponse.status).toBeGreaterThan(300) // request should fail (no 2xx status)

    const delResponse = await request(ADAPTER_URL)
      .delete(`/datasources/${datasourceId}`)
      .send()

    expect(delResponse.status).toEqual(204)

    // check for rabbitmq notification
    expect(publishedEvents.get(EXECUTION_FAILED_TOPIC)).toBeDefined()
    expect(publishedEvents.get(EXECUTION_FAILED_TOPIC)).toHaveLength(1)
    expect(publishedEvents.get(EXECUTION_FAILED_TOPIC)[0].datasourceId).toEqual(datasourceId)
    expect(publishedEvents.get(EXECUTION_FAILED_TOPIC)[0].error).toBeDefined()
  })
})

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
