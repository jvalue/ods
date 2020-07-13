const request = require('supertest')
const waitOn = require('wait-on')

const URL = process.env.CORE_API || 'http://localhost:8080'

describe('Core', () => {
  console.log('Core-Service URL= ' + URL)

  beforeAll(async () => {
    try {
      const pingUrl = URL + '/version'
      console.log('Waiting for service with URL: ' + pingUrl)
      await waitOn({ resources: [pingUrl], timeout: 50000 })
      console.log('[online] Service with URL:  ' + pingUrl)
    } catch (err) {
      process.exit(1)
    }
  }, 60000)

  test('GET /version', async () => {
    const response = await request(URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')

    const semanticVersionRegEx = '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionRegEx))
  })

  test('GET /pipelines', async () => {
    const response = await request(URL).get('/pipelines')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')

    expect(response.body).toEqual([])
  })

  test('POST & DELETE /pipelines', async () => {
    const response = await request(URL)
      .post('/pipelines')
      .send(pipelineConfig)

    expect(response.status).toEqual(201)
    expect(response.header.location).toContain(response.body.id)
    expect(response.body.transformation).toEqual(pipelineConfig.transformation)
    expect(response.body.id).toBeDefined()
    expect(response.body.id).not.toEqual(pipelineConfig.id) // id not under control of client
    expect(response.body.datasourceId).toEqual(pipelineConfig.datasourceId)

    const delResponse = await request(URL)
      .delete('/pipelines/' + response.body.id)
      .send()

    expect(delResponse.status).toEqual(204)
  })

  test('PUT & DELETE /pipelines/{id}', async () => {
    const postResponse = await request(URL)
      .post('/pipelines')
      .send(pipelineConfig)

    const pipelineId = postResponse.body.id

    const originalGetResponse = await request(URL)
      .get('/pipelines/' + pipelineId)

    const updatedConfig = Object.assign({}, pipelineConfig)
    updatedConfig.datasourceId = 999

    const putResponse = await request(URL)
      .put('/pipelines/' + pipelineId)
      .send(updatedConfig)

    expect(putResponse.status).toEqual(204)

    const updatedGetResponse = await request(URL)
      .get('/pipelines/' + pipelineId)

    expect(originalGetResponse.body.transformation).toEqual(updatedGetResponse.body.transformation)
    expect(originalGetResponse.body.metadata).toEqual(updatedGetResponse.body.metadata)
    expect(originalGetResponse.body.id).toEqual(updatedGetResponse.body.id)
    expect(originalGetResponse.body.datasourceId).not.toEqual(updatedGetResponse.body.datasourceId)

    const delResponse = await request(URL)
      .delete('/pipelines/' + pipelineId)
      .send()

    expect(delResponse.status).toEqual(204)
  })

  test('DELETE /pipelines/', async () => {
    await request(URL)
      .post('/pipelines')
      .send(pipelineConfig)
    await request(URL)
      .post('/pipelines')
      .send(pipelineConfig)

    const delResponse = await request(URL)
      .delete('/pipelines/')
      .send()

    expect(delResponse.status).toEqual(204)
  })

  test('GET /events', async () => {
    const response = await request(URL)
      .get('/events')
      .send()

    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
  })

  test('GET /events/pipeline/{id}', async () => {
    const pipelinesResponse = await request(URL)
      .post('/pipelines')
      .send(pipelineConfig)
    const pipelineId = pipelinesResponse.body.id

    await request(URL)
      .delete('/pipelines/' + pipelineId)

    const eventsResponse = await request(URL)
      .get('/events/pipeline/' + pipelineId)
      .send()

    expect(eventsResponse.status).toEqual(200)
    expect(eventsResponse.type).toEqual('application/json')
    expect(eventsResponse.body).toHaveLength(2)
    expect(eventsResponse.body[0].pipelineId).toBe(pipelineId)
    expect(eventsResponse.body[0].eventType).toEqual('PIPELINE_CREATE')
    expect(eventsResponse.body[1].pipelineId).toBe(pipelineId)
    expect(eventsResponse.body[1].eventType).toEqual('PIPELINE_DELETE')
  })

  test('GET /events [with offset]', async () => {
    const pipelinesResponse = await request(URL)
      .post('/pipelines')
      .send(pipelineConfig)
    const pipelineId = pipelinesResponse.body.id

    await request(URL)
      .delete('/pipelines/' + pipelineId)

    const eventsResponse = await request(URL)
      .get('/events/pipeline/' + pipelineId)
      .send()
    const eventId = eventsResponse.body[0].eventId

    const eventsAfter = await request(URL)
      .get('/events?after=' + eventId)
      .send()

    expect(eventsAfter.status).toEqual(200)
    expect(eventsAfter.type).toEqual('application/json')
    expect(eventsAfter.body).toHaveLength(1)
    expect(eventsAfter.body[0].eventId).toBe(eventId + 1)
    expect(eventsAfter.body[0].pipelineId).toBe(pipelineId)
    expect(eventsAfter.body[0].eventType).toEqual('PIPELINE_DELETE')
  })

  test('GET /events/latest', async () => {
    const postResponse = await request(URL)
      .post('/pipelines')
      .send(pipelineConfig)
    const pipelineId = postResponse.body.id

    await request(URL)
      .delete('/pipelines/' + pipelineId)
      .send()

    const response = await request(URL)
      .get('/events/latest')
      .send()

    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(Object.keys(response.body)).toHaveLength(3)
    expect(response.body.eventId).toBeTruthy()
    expect(response.body.pipelineId).toBe(pipelineId)
    expect(response.body.eventType).toEqual('PIPELINE_DELETE')
  })

  test('Persist long transformation function', async () => {
    const configToPersist = Object.assign({}, pipelineConfig)
    const crazyLongTransformation = {
      func: 'a'.repeat(256),
      data: '{}'
    }
    configToPersist.transformation = crazyLongTransformation

    // create pipeline to persist
    const creationResponse = await request(URL)
      .post('/pipelines')
      .send(configToPersist)

    expect(creationResponse.status).toEqual(201)
    const pipelineId = creationResponse.body.id

    // check persisted pipeline config
    const pipelineResponse = await request(URL)
      .get(`/pipelines/${pipelineId}`)
      .send()

    expect(pipelineResponse.body.transformation).toEqual(crazyLongTransformation)

    // clean up
    await request(URL)
      .delete(`/pipelines/${pipelineId}`)
      .send()
  })
})

const pipelineConfig = {
  id: 12345,
  datasourceId: 1,
  transformation: {
    func: 'return data+data;',
    data: '[1]'
  },
  metadata: {
    author: 'icke',
    license: 'none',
    displayName: 'test pipeline 1',
    description: 'integraiton testing pipeline'
  }
}
