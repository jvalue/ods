const request = require('supertest')
const waitOn = require('wait-on')

const URL = process.env.ADAPTER_API || 'http://localhost:9000/api/adapter'
const MOCK_SERVER_PORT = process.env.MOCK_SERVER_PORT || 8081
const MOCK_SERVER_HOST = process.env.MOCK_SERVER_HOST || 'localhost'
const MOCK_SERVER_URL = 'http://' + MOCK_SERVER_HOST + ':' + MOCK_SERVER_PORT
const RABBIT_URL = `http://${process.env.RABBIT_HOST}:15672`

describe('Adapter Configuration', () => {
  console.log('Adapter-Service URL= ' + URL)

  beforeAll(async () => {
    try {
      const pingUrl = URL + '/version'
      console.log('Waiting for service with URL: ' + pingUrl)
      console.log('Waiting for service with URL: ' + MOCK_SERVER_URL)
      console.log('Waiting for service with URL: ' + RABBIT_URL)
      await waitOn({ resources: [pingUrl, MOCK_SERVER_URL, RABBIT_URL], timeout: 50000 })
      console.log('[online] Service with URL:  ' + pingUrl)
      console.log('[online] Service with URL:  ' + MOCK_SERVER_URL)
      console.log('[online] Service with URL:  ' + RABBIT_URL)
    } catch (err) {
      process.exit(1)
    }
  }, 60000)

  test('GET /version', async () => {
    const response = await request(URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')

    //
    const semanticVersionRegEx = '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionRegEx))
  })

  test('GET /datasources', async () => {
    const response = await request(URL).get('/datasources')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')

    expect(response.body).toEqual([])
  })

  test('POST & DELETE /datasources', async () => {
    const response = await request(URL)
      .post('/datasources')
      .send(datasourceConfig)

    expect(response.status).toEqual(201)
    expect(response.header.location).toContain(response.body.id)
    expect(response.body.adapter).toEqual(datasourceConfig.adapter)
    expect(response.body.trigger).toEqual(datasourceConfig.trigger)
    expect(response.body.id).toBeDefined()
    expect(response.body.id).not.toEqual(datasourceConfig.id) // id not under control of client

    const delResponse = await request(URL)
      .delete('/datasources/' + response.body.id)
      .send()

    expect(delResponse.status).toEqual(204)
  })

  test('PUT & DELETE /datasources/{id}', async () => {
    const postResponse = await request(URL)
      .post('/datasources')
      .send(datasourceConfig)

    const datasourceId = postResponse.body.id

    const originalGetResponse = await request(URL)
      .get('/datasources/' + datasourceId)

    const updatedConfig = Object.assign({}, datasourceConfig)
    updatedConfig.protocol.parameters.location = 'http://www.disrespect.com'

    const putResponse = await request(URL)
      .put('/datasources/' + datasourceId)
      .send(updatedConfig)

    expect(putResponse.status).toEqual(204)

    const updatedGetResponse = await request(URL)
      .get('/datasources/' + datasourceId)

    expect(originalGetResponse.body.metadata).toEqual(updatedGetResponse.body.metadata)
    expect(originalGetResponse.body.id).toEqual(updatedGetResponse.body.id)

    // not sure if it should behave like that?!
    expect(originalGetResponse.body.adapter).toEqual(updatedGetResponse.body.adapter)

    const delResponse = await request(URL)
      .delete('/datasources/' + datasourceId)
      .send()

    expect(delResponse.status).toEqual(204)
  })

  test('DELETE /datasources/', async () => {
    await request(URL)
      .post('/datasources')
      .send(datasourceConfig)
    await request(URL)
      .post('/datasources')
      .send(datasourceConfig)

    const delResponse = await request(URL)
      .delete('/datasources/')
      .send()

    expect(delResponse.status).toEqual(204)
  })

  test('GET /datasources/events', async () => {
    const response = await request(URL)
      .get('/datasources/events')
      .send()

    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
  })

  test('GET /datasources/events?datasourceId={id}', async () => {
    const datasourceResponse = await request(URL)
      .post('/datasources')
      .send(datasourceConfig)
    const datasourceId = datasourceResponse.body.id

    await request(URL)
      .delete('/datasources/' + datasourceId)

    const eventsResponse = await request(URL)
      .get('/datasources/events?datasourceId=' + datasourceId)
      .send()

    expect(eventsResponse.status).toEqual(200)
    expect(eventsResponse.type).toEqual('application/json')
    expect(eventsResponse.body).toHaveLength(2)
    expect(eventsResponse.body[0].datasourceId).toBe(datasourceId)
    expect(eventsResponse.body[0].eventType).toEqual('DATASOURCE_CREATE')
    expect(eventsResponse.body[1].datasourceId).toBe(datasourceId)
    expect(eventsResponse.body[1].eventType).toEqual('DATASOURCE_DELETE')
  })

  test('GET /events [with offset]', async () => {
    const datasourceResponse = await request(URL)
      .post('/datasources')
      .send(datasourceConfig)
    const datasourceId = datasourceResponse.body.id

    await request(URL)
      .delete('/datasources/' + datasourceId)

    const eventsResponse = await request(URL)
      .get('/datasources/events?datasourceId=' + datasourceId)
      .send()
    const eventId = eventsResponse.body[0].eventId

    const eventsAfter = await request(URL)
      .get('/datasources/events?after=' + eventId)
      .send()

    expect(eventsAfter.status).toEqual(200)
    expect(eventsAfter.type).toEqual('application/json')
    expect(eventsAfter.body).toHaveLength(1)
    expect(eventsAfter.body[0].eventId).toBe(eventId + 1)
    expect(eventsAfter.body[0].datasourceId).toBe(datasourceId)
    expect(eventsAfter.body[0].eventType).toEqual('DATASOURCE_DELETE')
  })

  test('GET datasources/events/latest', async () => {
    const postResponse = await request(URL)
      .post('/datasources')
      .send(datasourceConfig)
    const datasourceId = postResponse.body.id

    await request(URL)
      .delete('/datasources/' + datasourceId)
      .send()

    const response = await request(URL)
      .get('/datasources/events/latest')
      .send()

    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(Object.keys(response.body)).toHaveLength(3)
    expect(response.body.eventId).toBeTruthy()
    expect(response.body.datasourceId).toBe(datasourceId)
    expect(response.body.eventType).toEqual('DATASOURCE_DELETE')
  })
})

test('POST datasources/{id}/trigger dynamic', async () => {
  const datasourceResponse = await request(URL)
    .post('/datasources')
    .send(dynamicDatasourceConfig)
  const datasourceId = datasourceResponse.body.id

  const dynamicDataMetaData = await request(URL)
    .post(`/datasources/${datasourceId}/trigger`)
    .send(runtimeParameters)

  const staticDataMetaData = await request(URL)
    .post(`/datasources/${datasourceId}/trigger`)
    .send(null)

  const dynId = dynamicDataMetaData.body.id
  const dynamicData = await request(URL)
    .get(`/data/${dynId}`)
    .send()

  const staticId = dynamicDataMetaData.body.id
  const staticData = await request(URL)
    .get(`/data/${dynId}`)
    .send()

  const delResponse = await request(URL)
    .delete('/datasources/')
    .send()

  expect(delResponse.status).toEqual(204)
  expect(datasourceResponse.status).toEqual(201)
  expect(dynamicDataMetaData.status).toEqual(200)
  expect(dynamicDataMetaData.body.id).toBeGreaterThanOrEqual(0)
  expect(dynamicDataMetaData.body.location).toEqual(`/data/${dynId}`)
  expect(staticDataMetaData.status).toEqual(200)
  expect(staticDataMetaData.body.id).toBeGreaterThanOrEqual(0)
  expect(staticDataMetaData.body.location).toEqual(`/data/${staticId}`)
  expect(dynamicData.status).toEqual(200)
  expect(dynamicData.body.id).toBe(runtimeParameters.parameters.id)
  expect(staticData.status).toEqual(200)
  expect(staticData.body.id).toBe(dynamicDatasourceConfig.protocol.parameters.defaultParameters.id)
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

const datasourceConfig = {
  id: 12345,
  protocol: {
    type: 'HTTP',
    parameters: {
      location: 'http://www.nodisrespect.org'
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
    author: 'icke',
    license: 'none',
    displayName: 'test datasource 1',
    description: 'integraiton testing datasources'
  }
}

const dynamicDatasourceConfig = {
  id: 54321,
  protocol: {
    type: 'HTTP',
    parameters: {
      location: MOCK_SERVER_URL + '/json/{id}',
      encoding: 'UTF-8',
      defaultParameters: { id: 1 }
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
