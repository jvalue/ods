const request = require('supertest')

const {
  ADAPTER_URL,
  MOCK_SERVER_URL,
  AMQP_URL,
  PUBLICATION_DELAY
} = require('./env')
const { waitForServicesToBeReady } = require('./waitForServices')
const {
  connectAmqp,
  consumeAmqpMsg,
  sleep
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
    expect(datasourceResponse.status).toEqual(201)
    const datasourceId = datasourceResponse.body.id

    const dataImportMetaData = await request(ADAPTER_URL)
      .post(`/datasources/${datasourceId}/trigger`)
      .send(runtimeParameters)
    expect(dataImportMetaData.status).toEqual(200)
    expect(dataImportMetaData.body.id).toBeGreaterThanOrEqual(0)
    expect(dataImportMetaData.body.timestamp).toBeTruthy()
    const dataImportId = dataImportMetaData.body.id
    expect(dataImportMetaData.body.location).toEqual(`/datasources/${datasourceId}/imports/${dataImportId}/data`)

    const data = await request(ADAPTER_URL)
      .get(dataImportMetaData.body.location)
      .send()
    expect(data.status).toEqual(200)
    expect(data.body.id).toBe(runtimeParameters.parameters.id)

    const delResponse = await request(ADAPTER_URL)
      .delete(`/datasources/${datasourceId}`)
      .send()
    expect(delResponse.status).toEqual(204)

    // check for rabbitmq message
    await sleep(PUBLICATION_DELAY)
    expect(publishedEvents.get(EXECUTION_SUCCESS_TOPIC)).toContainEqual({
      datasourceId: datasourceId,
      data: '{"id":"2"}'
    }, TIMEOUT)
  })

  test('Should trigger datasources with default parameters [POST /datasources/{id}/trigger]', async () => {
    const datasourceResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(dynamicDatasourceConfig)
    expect(datasourceResponse.status).toEqual(201)
    const datasourceId = datasourceResponse.body.id

    const dataImportMetadata = await request(ADAPTER_URL)
      .post(`/datasources/${datasourceId}/trigger`)
      .send(null)
    expect(dataImportMetadata.status).toEqual(200)
    expect(dataImportMetadata.body.id).toBeGreaterThanOrEqual(0)
    const dataImportId = dataImportMetadata.body.id
    expect(dataImportMetadata.body.location).toEqual(`/datasources/${datasourceId}/imports/${dataImportId}/data`)

    const data = await request(ADAPTER_URL)
      .get(dataImportMetadata.body.location)
      .send()
    expect(data.status).toEqual(200)
    expect(data.body.id).toBe(dynamicDatasourceConfig.protocol.parameters.defaultParameters.id)

    const delResponse = await request(ADAPTER_URL)
      .delete(`/datasources/${datasourceId}`)
      .send()
    expect(delResponse.status).toEqual(204)

    // check for rabbitmq message
    await sleep(PUBLICATION_DELAY)
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
    expect(dataMetaData.status).toEqual(200)
    expect(dataMetaData.body.id).toBeGreaterThanOrEqual(0)
    const dataImportId = dataMetaData.body.id
    expect(dataMetaData.body.location).toEqual(`/datasources/${datasourceId}/imports/${dataImportId}/data`)

    const data = await request(ADAPTER_URL)
      .get(dataMetaData.body.location)
      .send()
    expect(data.status).toEqual(200)
    expect(data.body.id).toEqual('1')

    const delResponse = await request(ADAPTER_URL)
      .delete(`/datasources/${datasourceId}`)
      .send()
    expect(delResponse.status).toEqual(204)

    // check for rabbitmq message
    await sleep(PUBLICATION_DELAY)
    expect(publishedEvents.get(EXECUTION_SUCCESS_TOPIC)).toContainEqual({
      datasourceId: datasourceId,
      data: '{"id":"1"}'
    })
  })

  test('Should return 404 NOT_FOUND when trigger unknown datasources [POST /datasources/0/trigger]', async () => {
    const triggerResponse = await request(ADAPTER_URL)
      .post('/datasources/0/trigger')
      .send()

    expect(triggerResponse.status).toEqual(404)
  })

  test('Should publish results for datasources with invalid location [POST /datasources/{id}/trigger]', async () => {
    const brokenDatasourceConfig = JSON.parse(JSON.stringify(staticDatasourceConfig))
    brokenDatasourceConfig.protocol.parameters.location = 'invalid-location'
    const datasourceResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(brokenDatasourceConfig)

    const datasourceId = datasourceResponse.body.id

    const triggerResponse = await request(ADAPTER_URL)
      .post(`/datasources/${datasourceId}/trigger`)
      .send()
    expect(triggerResponse.status).toEqual(400)

    const delResponse = await request(ADAPTER_URL)
      .delete(`/datasources/${datasourceId}`)
      .send()
    expect(delResponse.status).toEqual(204)

    // check for rabbitmq message
    await sleep(PUBLICATION_DELAY)
    expect(publishedEvents.get(EXECUTION_FAILED_TOPIC)).toContainEqual({
      datasourceId: datasourceId,
      error: 'URI is not absolute'
    })
  })

  test('Should publish results for datasources with failing import [POST /datasources/{id}/trigger]', async () => {
    const brokenDatasourceConfig = JSON.parse(JSON.stringify(staticDatasourceConfig))
    brokenDatasourceConfig.protocol.parameters.location = MOCK_SERVER_URL + '/not-found'
    const datasourceResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(brokenDatasourceConfig)

    const datasourceId = datasourceResponse.body.id

    const triggerResponse = await request(ADAPTER_URL)
      .post(`/datasources/${datasourceId}/trigger`)
      .send()
    expect(triggerResponse.status).toEqual(500)

    const delResponse = await request(ADAPTER_URL)
      .delete(`/datasources/${datasourceId}`)
      .send()
    expect(delResponse.status).toEqual(204)

    // check for rabbitmq notification
    await sleep(PUBLICATION_DELAY)
    expect(publishedEvents.get(EXECUTION_FAILED_TOPIC)).toContainEqual({
      datasourceId: datasourceId,
      error: '404 Not Found: [404 NOT FOUND Error]'
    })
  })

  test('Should persist data after trigger [POST /datasources/{id}/trigger]', async () => {
    const creationResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(staticDatasourceConfig)
    expect(creationResponse.status).toEqual(201)

    const triggerResponse = await request(ADAPTER_URL)
      .post(`/datasources/${creationResponse.body.id}/trigger`)
      .send()
    expect(triggerResponse.status).toEqual(200)

    const dataResponse = await request(ADAPTER_URL)
      .get(triggerResponse.body.location)
    expect(dataResponse.status).toEqual(200)
    expect(dataResponse.body).toEqual({ id: '1' })
  })
})

const dynamicDatasourceConfig = {
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
    author: 'author',
    license: 'none',
    displayName: 'test datasource 2',
    description: 'integration testing dynamic datasources'
  },
  schema: {
    test: 1
  }
}

const staticDatasourceConfig = {
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
    author: 'author',
    license: 'none',
    displayName: 'test datasource 2',
    description: 'integration testing dynamic datasources'
  },
  schema: {
    test: 1
  }
}

const runtimeParameters = {
  parameters: {
    id: '2'
  }
}
