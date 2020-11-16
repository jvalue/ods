const request = require('supertest')

const {
  ADAPTER_URL,
  AMQP_URL
} = require('./env')
const { waitForServicesToBeReady } = require('./waitForServices')
const {
  connectAmqp,
  consumeAmqpMsg
} = require('./testHelper')

const AMQP_EXCHANGE = 'ods_global'
const AMQP_QUEUE = 'adapter-it-ds'
const CONFIG_TOPIC = 'datasource.config.*'
const CONFIG_CREATED_TOPIC = 'datasource.config.created'
const CONFIG_DELETED_TOPIC = 'datasource.config.deleted'
const CONFIG_UPDATED_TOPIC = 'datasource.config.updated'

const TIMEOUT = 10000
const publishedEvents = new Map() // routing key -> received msgs
let amqpConnection

describe('Datasource Configuration', () => {
  beforeAll(async () => {
    await waitForServicesToBeReady()

    amqpConnection = await connectAmqp(AMQP_URL)

    await consumeAmqpMsg(amqpConnection, AMQP_EXCHANGE, CONFIG_TOPIC, AMQP_QUEUE, publishedEvents)
  }, 60000)

  afterAll(async () => {
    await request(ADAPTER_URL)
      .delete('/configs')
      .send()
    if (amqpConnection) {
      await amqpConnection.close()
    }
  }, TIMEOUT)

  test('Should respond with stored datasource configs', async () => {
    const response = await request(ADAPTER_URL).get('/datasources')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')

    expect(response.body).toBeInstanceOf(Array)
  }, TIMEOUT)

  test('Should reject datasources with specified id', async () => {
    const datasourceConfig = getDatasourceConfig()
    datasourceConfig.id = 1
    const response = await request(ADAPTER_URL)
      .post('/datasources')
      .send(datasourceConfig)
    expect(response.status).toEqual(400)
  })

  test('Should create datasources [POST /datasources]', async () => {
    const datasourceConfig = getDatasourceConfig()
    const response = await request(ADAPTER_URL)
      .post('/datasources')
      .send(datasourceConfig)
    const datasource = response.body

    expect(response.status).toEqual(201)
    expect(response.header.location).toContain(response.body.id)
    expect(response.body.adapter).toEqual(datasourceConfig.adapter)
    expect(response.body.trigger).toEqual(datasourceConfig.trigger)
    expect(response.body.id).toBeGreaterThan(0)

    expect(publishedEvents.get(CONFIG_CREATED_TOPIC)).toContainEqual({
      datasource
    })

    const allDatasourceResponse = await request(ADAPTER_URL)
      .get('/datasources')
    expect(allDatasourceResponse.body).toContainEqual(datasource)
  }, TIMEOUT)

  test('Should not create datasource with unsupported protocol [POST /datasources]', async () => {
    const invalidDatasourceConfig = getDatasourceConfig()
    invalidDatasourceConfig.protocol.type = 'UNSUPPORTED'
    const datasourceResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(invalidDatasourceConfig)

    expect(datasourceResponse.status).toEqual(400)
  }, TIMEOUT)

  test('Should not create datasource with unsupported format [POST /datasources]', async () => {
    const invalidDatasourceConfig = getDatasourceConfig()
    invalidDatasourceConfig.format.type = 'UNSUPPORTED'
    const datasourceResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(invalidDatasourceConfig)

    expect(datasourceResponse.status).toEqual(400)
  }, TIMEOUT)

  test('Should create datasource with long URL [POST /datasources]', async () => {
    const longUrlDatasourceConfig = getDatasourceConfig()
    const queryParameter = '&veryLongProfessionalParameter=verylongProfessionalParameterValue'
    const longUrl = 'http://www.very-long-professional-location-that-might-not-fit-in-the-database.com?first=test' + queryParameter.repeat(40)
    longUrlDatasourceConfig.protocol.parameters.location = longUrl
    const response = await request(ADAPTER_URL)
      .post('/datasources')
      .send(longUrlDatasourceConfig)

    expect(response.status).toEqual(201)
  })

  test('Should update existing datasource [PUT /datasources/{id}]', async () => {
    const postResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(getDatasourceConfig())
    const createdDatasource = postResponse.body

    const originalGetResponse = await request(ADAPTER_URL)
      .get('/datasources/' + createdDatasource.id)

    const updatedConfig = getDatasourceConfig()
    updatedConfig.protocol.parameters.location = 'http://www.professional-location.com'

    const putResponse = await request(ADAPTER_URL)
      .put('/datasources/' + createdDatasource.id)
      .send(updatedConfig)

    expect(putResponse.status).toEqual(204)
    updatedConfig.id = createdDatasource.id
    updatedConfig.metadata.creationTimestamp = createdDatasource.metadata.creationTimestamp
    expect(publishedEvents.get(CONFIG_UPDATED_TOPIC)).toContainEqual({
      datasource: updatedConfig
    })

    const updatedGetResponse = await request(ADAPTER_URL)
      .get('/datasources/' + createdDatasource.id)

    expect(originalGetResponse.body.metadata).toEqual(updatedGetResponse.body.metadata)
    expect(originalGetResponse.body.id).toEqual(updatedGetResponse.body.id)

    expect(originalGetResponse.body.adapter).toEqual(updatedGetResponse.body.adapter)
  }, TIMEOUT)

  test('Should not update datasource with unsupported protocol [PUT /datasources/{id}]', async () => {
    const postResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(getDatasourceConfig())
    expect(postResponse.status).toEqual(201)
    const datasourceId = postResponse.body.id

    const originalGetResponse = await request(ADAPTER_URL)
      .get('/datasources/' + datasourceId)
    expect(originalGetResponse.status).toEqual(200)

    const invalidDatasourceConfig = getDatasourceConfig()
    invalidDatasourceConfig.protocol.type = 'UNSUPPORTED'
    const datasourceResponse = await request(ADAPTER_URL)
      .put('/datasources/' + datasourceId)
      .send(invalidDatasourceConfig)
    expect(datasourceResponse.status).toEqual(400)

    const updatedGetResponse = await request(ADAPTER_URL)
      .get('/datasources/' + datasourceId)
    expect(updatedGetResponse.status).toEqual(200)

    expect(originalGetResponse.body).toEqual(updatedGetResponse.body)

    const delResponse = await request(ADAPTER_URL)
      .delete('/datasources/' + datasourceId)
      .send()
    expect(delResponse.status).toEqual(204)
  }, TIMEOUT)

  test('Should not update datasource with unsupported format [PUT /datasources/{id}]', async () => {
    const postResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(getDatasourceConfig())
    expect(postResponse.status).toEqual(201)
    const datasourceId = postResponse.body.id

    const originalGetResponse = await request(ADAPTER_URL)
      .get('/datasources/' + datasourceId)
    expect(originalGetResponse.status).toEqual(200)

    const invalidDatasourceConfig = getDatasourceConfig()
    invalidDatasourceConfig.format.type = 'UNSUPPORTED'
    const datasourceResponse = await request(ADAPTER_URL)
      .put('/datasources/' + datasourceId)
      .send(invalidDatasourceConfig)
    expect(datasourceResponse.status).toEqual(400)

    const updatedGetResponse = await request(ADAPTER_URL)
      .get('/datasources/' + datasourceId)
    expect(updatedGetResponse.status).toEqual(200)

    expect(originalGetResponse.body).toEqual(updatedGetResponse.body)

    const delResponse = await request(ADAPTER_URL)
      .delete('/datasources/' + datasourceId)
      .send()
    expect(delResponse.status).toEqual(204)
  }, TIMEOUT)

  test('Should delete specific datasource [DELETE /datasources/{id}]', async () => {
    const response = await request(ADAPTER_URL)
      .post('/datasources')
      .send(getDatasourceConfig())
    const datasource = response.body

    const delResponse = await request(ADAPTER_URL)
      .delete(`/datasources/${datasource.id}`)
      .send()

    expect(delResponse.status).toEqual(204)

    expect(publishedEvents.get(CONFIG_DELETED_TOPIC)).toContainEqual({
      datasource
    })

    const getDeletedRequest = await request(ADAPTER_URL)
      .get(`/datasource/${datasource.id}`)
      .send()

    expect(getDeletedRequest.status).toEqual(404)
  }, TIMEOUT)

  test('Should return 404 NOT FOUND when deleting unknown datasource [DELETE /datasources/0]', async () => {
    const delResponse = await request(ADAPTER_URL)
      .delete('/datasources/0')
      .send()
    expect(delResponse.status).toEqual(404)
  }, TIMEOUT)

  test('Should delete all datasources [DELETE /datasources/]', async () => {
    await request(ADAPTER_URL)
      .post('/datasources')
      .send(getDatasourceConfig())
    await request(ADAPTER_URL)
      .post('/datasources')
      .send(getDatasourceConfig())

    const delResponse = await request(ADAPTER_URL)
      .delete('/datasources/')
      .send()

    expect(delResponse.status).toEqual(204)
    const sourcesRequest = await request(ADAPTER_URL)
      .get('/datasources/')
    expect(sourcesRequest.body).toEqual([])
  }, TIMEOUT)
})

const getDatasourceConfig = () => ({
  protocol: {
    type: 'HTTP',
    parameters: {
      location: 'http://www.professional-location.com'
    }
  },
  format: {
    type: 'XML',
    parameters: {}
  },
  trigger: {
    firstExecution: '1905-12-01T02:30:00.123Z',
    periodic: true,
    interval: 50000
  },
  metadata: {
    author: 'professional-author',
    license: 'none',
    displayName: 'test datasource 1',
    description: 'integration testing datasources'
  }
})
