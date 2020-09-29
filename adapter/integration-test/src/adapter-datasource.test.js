const request = require('supertest')

const {
  ADAPTER_URL
} = require('./env')
const { waitForServicesToBeReady } = require('./waitForServices')

describe('Adapter Configuration', () => {
  beforeAll(async () => {
    await waitForServicesToBeReady()
  }, 60000)

  test('GET /version', async () => {
    const response = await request(ADAPTER_URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')

    //
    const semanticVersionRegEx = '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionRegEx))
  })

  test('GET /datasources', async () => {
    const response = await request(ADAPTER_URL).get('/datasources')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')

    expect(response.body).toEqual([])
  })

  test('POST & DELETE /datasources', async () => {
    const response = await request(ADAPTER_URL)
      .post('/datasources')
      .send(datasourceConfig)

    expect(response.status).toEqual(201)
    expect(response.header.location).toContain(response.body.id)
    expect(response.body.adapter).toEqual(datasourceConfig.adapter)
    expect(response.body.trigger).toEqual(datasourceConfig.trigger)
    expect(response.body.id).toBeDefined()
    expect(response.body.id).not.toEqual(datasourceConfig.id) // id not under control of client

    const delResponse = await request(ADAPTER_URL)
      .delete('/datasources/' + response.body.id)
      .send()

    expect(delResponse.status).toEqual(204)
  })

  test('PUT & DELETE /datasources/{id}', async () => {
    const postResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(datasourceConfig)

    const datasourceId = postResponse.body.id

    const originalGetResponse = await request(ADAPTER_URL)
      .get('/datasources/' + datasourceId)

    const updatedConfig = Object.assign({}, datasourceConfig)
    updatedConfig.protocol.parameters.location = 'http://www.disrespect.com'

    const putResponse = await request(ADAPTER_URL)
      .put('/datasources/' + datasourceId)
      .send(updatedConfig)

    expect(putResponse.status).toEqual(204)

    const updatedGetResponse = await request(ADAPTER_URL)
      .get('/datasources/' + datasourceId)

    expect(originalGetResponse.body.metadata).toEqual(updatedGetResponse.body.metadata)
    expect(originalGetResponse.body.id).toEqual(updatedGetResponse.body.id)

    // not sure if it should behave like that?!
    expect(originalGetResponse.body.adapter).toEqual(updatedGetResponse.body.adapter)

    const delResponse = await request(ADAPTER_URL)
      .delete('/datasources/' + datasourceId)
      .send()

    expect(delResponse.status).toEqual(204)
  })

  test('DELETE /datasources/', async () => {
    await request(ADAPTER_URL)
      .post('/datasources')
      .send(datasourceConfig)
    await request(ADAPTER_URL)
      .post('/datasources')
      .send(datasourceConfig)

    const delResponse = await request(ADAPTER_URL)
      .delete('/datasources/')
      .send()

    expect(delResponse.status).toEqual(204)
  })

  test('GET /datasources/events', async () => {
    const response = await request(ADAPTER_URL)
      .get('/datasources/events')
      .send()

    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
  })

  test('GET /datasources/events?datasourceId={id}', async () => {
    const datasourceResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(datasourceConfig)
    const datasourceId = datasourceResponse.body.id

    await request(ADAPTER_URL)
      .delete('/datasources/' + datasourceId)

    const eventsResponse = await request(ADAPTER_URL)
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
    const datasourceResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(datasourceConfig)
    const datasourceId = datasourceResponse.body.id

    await request(ADAPTER_URL)
      .delete('/datasources/' + datasourceId)

    const eventsResponse = await request(ADAPTER_URL)
      .get('/datasources/events?datasourceId=' + datasourceId)
      .send()
    const eventId = eventsResponse.body[0].eventId

    const eventsAfter = await request(ADAPTER_URL)
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
    const postResponse = await request(ADAPTER_URL)
      .post('/datasources')
      .send(datasourceConfig)
    const datasourceId = postResponse.body.id

    await request(ADAPTER_URL)
      .delete('/datasources/' + datasourceId)
      .send()

    const response = await request(ADAPTER_URL)
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
