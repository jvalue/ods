/* eslint-env jest */
// @ts-check
const request = require('supertest')

const {
  ADAPTER_URL,
  MOCK_SERVER_URL,
  AMQP_URL,
  AMQP_EXCHANGE,
  AMQP_IT_QUEUE,
  EXECUTION_TOPIC,
  EXECUTION_FAILED_TOPIC,
  EXECUTION_SUCCESS_TOPIC
} = require('./env')
const { waitForServicesToBeReady } = require('./waitForServices')
const {
  connectAmqp,
  receiveAmqp,
  closeAmqp
} = require('./testHelper')

const TIMEOUT = 10000

const publishedEvents = new Map() // routing key -> received msgs []

describe('Adapter Sources Trigger', () => {
  beforeAll(async () => {
    await waitForServicesToBeReady()

    console.log(`Services available. Connecting to amqp at ${AMQP_URL} ...`)
    await connectAmqp(AMQP_URL)

    await receiveAmqp(AMQP_URL, AMQP_EXCHANGE, EXECUTION_TOPIC, AMQP_IT_QUEUE, publishedEvents)
    console.log('Amqp connection established')
  }, 60000)

  afterAll(async () => {
    await closeAmqp()

    // clear stored configs
    await request(ADAPTER_URL)
      .delete('/configs')
      .send()
  }, TIMEOUT)

  test('POST datasources/{id}/trigger dynamic', async () => {
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

  test('POST datasources/{id}/trigger dynamic defaultvalues', async () => {
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

  test('POST datasources/{id}/trigger static', async () => {
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

  test('POST datasource/{id}/trigger FAIL', async () => {
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
