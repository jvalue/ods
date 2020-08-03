const request = require('supertest')
const waitOn = require('wait-on')

const URL = process.env.TRANSFORMATION_API || 'http://localhost:8080'

describe('Pipeline Config Test', () => {
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

  afterAll(async () => {
    // clear stored configs
    await request(URL)
      .delete('/configs')
      .send()
  })

  test('GET /configs', async () => {
    const response = await request(URL).get('/configs')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')

    expect(response.body).toEqual([])
  })

  test('POST & DELETE /configs', async () => {
    const response = await request(URL)
      .post('/configs')
      .send(pipelineConfig)

    expect(response.status).toEqual(201)
    expect(response.header.location).toContain(response.body.id)

    expect(response.body.id).toBeDefined()
    expect(response.body.id).not.toEqual(pipelineConfig.id) // id not under control of client
    expect(response.body.datasourceId).toEqual(pipelineConfig.datasourceId)

    expect(response.body.transformation).toEqual(pipelineConfig.transformation)

    expect(response.body.metadata.author).toEqual(pipelineConfig.metadata.author)
    expect(response.body.metadata.description).toEqual(pipelineConfig.metadata.description)
    expect(response.body.metadata.displayName).toEqual(pipelineConfig.metadata.displayName)
    expect(response.body.metadata.license).toEqual(pipelineConfig.metadata.license)
    expect(response.body.metadata.creationTimestamp).toBeDefined()

    const delResponse = await request(URL)
      .delete('/configs/' + response.body.id)
      .send()

    expect(delResponse.status).toEqual(204)
  })

  test('PUT & DELETE /configs/{id}', async () => {
    const postResponse = await request(URL)
      .post('/configs')
      .send(pipelineConfig)

    const pipelineId = postResponse.body.id

    const originalGetResponse = await request(URL)
      .get('/configs/' + pipelineId)

    const updatedConfig = Object.assign({}, pipelineConfig)
    updatedConfig.datasourceId = 999

    const putResponse = await request(URL)
      .put('/configs/' + pipelineId)
      .send(updatedConfig)

    expect(putResponse.status).toEqual(204)

    const updatedGetResponse = await request(URL)
      .get('/configs/' + pipelineId)

    expect(originalGetResponse.body.transformation).toEqual(updatedGetResponse.body.transformation)
    expect(originalGetResponse.body.metadata).toEqual(updatedGetResponse.body.metadata)
    expect(originalGetResponse.body.id).toEqual(updatedGetResponse.body.id)
    expect(originalGetResponse.body.datasourceId).not.toEqual(updatedGetResponse.body.datasourceId)

    const delResponse = await request(URL)
      .delete('/configs/' + pipelineId)
      .send()

    expect(delResponse.status).toEqual(204)
  })

  test('DELETE /configs/', async () => {
    await request(URL)
      .post('/configs')
      .send(pipelineConfig)
    await request(URL)
      .post('/configs')
      .send(pipelineConfig)

    const delResponse = await request(URL)
      .delete('/configs/')
      .send()

    expect(delResponse.status).toEqual(204)
  })

  test('Persist long transformation function', async () => {
    const configToPersist = Object.assign({}, pipelineConfig)
    const crazyLongTransformation = {
      func: 'a'.repeat(256)
    }
    configToPersist.transformation = crazyLongTransformation

    // create pipeline to persist
    const creationResponse = await request(URL)
      .post('/configs')
      .send(configToPersist)

    expect(creationResponse.status).toEqual(201)
    const pipelineId = creationResponse.body.id

    // check persisted pipeline config
    const pipelineResponse = await request(URL)
      .get(`/configs/${pipelineId}`)
      .send()

    expect(pipelineResponse.body.transformation).toEqual(crazyLongTransformation)

    // clean up
    await request(URL)
      .delete(`/configs/${pipelineId}`)
      .send()
  })
})

const pipelineConfig = {
  id: 12345,
  datasourceId: 1,
  transformation: {
    func: 'return data+data;',
  },
  metadata: {
    author: 'icke',
    license: 'none',
    displayName: 'test pipeline 1',
    description: 'integraiton testing pipeline'
  }
}
