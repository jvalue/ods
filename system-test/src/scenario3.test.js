const request = require('supertest')
const {
  STORAGE_URL,
  ADAPTER_URL,
  TRANSFORMATION_URL,
  NOTIFICATION_URL,
  MOCK_SERVER_URL,
  MOCK_SERVER_WITHIN_DOCKER
} = require('./env')
const {
  generateDataSourceConfig,
  generatePipelineConfig,
  generateSourceData, checkWebhook
} = require('./testHelper')
const { waitForServicesToBeReady } = require('./waitForServices')

const TIMEOUT = 60000

let dataSourceConfig = null

let dataSourceId = -1
let pipelineId = -1

describe('Test 3: Create non-periodic pipeline with transformation', () => {
  beforeAll(async () => {
    await waitForServicesToBeReady()
  }, TIMEOUT)

  afterAll(async () => {
    await Promise.all([
      request(ADAPTER_URL).delete('/').send(),
      request(TRANSFORMATION_URL).delete('/configs').send(),
      request(MOCK_SERVER_URL).delete('/').send()
    ])
  }, TIMEOUT)

  test('Prepare mock service', async () => {
    const response = await request(MOCK_SERVER_URL).post('/data/test3').send(generateSourceData())
    expect(response.status).toEqual(201)
    dataSourceConfig = generateDataSourceConfig(MOCK_SERVER_WITHIN_DOCKER + '/data/test3', false)
  }, TIMEOUT)

  test('Create DataSource at adapter service', async () => {
    const response = await request(ADAPTER_URL).post('/datasources').send(dataSourceConfig)
    expect(response.status).toEqual(201)

    dataSourceId = response.body.id
    expect(dataSourceId).toBeGreaterThan(0)
  }, TIMEOUT)

  test('Add pipeline to DataSource', async () => {
    const pipelineConfig = generatePipelineConfig(dataSourceId)
    pipelineConfig.transformation = { func: 'data.someField = 42; return data;' }

    const response = await request(TRANSFORMATION_URL).post('/configs').send(pipelineConfig)
    expect(response.status).toEqual(201)

    pipelineId = response.body.id
    expect(pipelineId).toBeGreaterThan(0)
  }, TIMEOUT)

  test('Create notification', async () => {
    const notificationConfig = {
      condition: 'data.someField === 42',
      url: MOCK_SERVER_WITHIN_DOCKER + '/notifications/test3',
      pipelineId: pipelineId
    }

    const response = await request(NOTIFICATION_URL).post('/config/webhook').send(notificationConfig)
    expect(response.status).toEqual(201)
    expect(response.body.id).toBeGreaterThan(0)
  }, TIMEOUT)

  test('Check notification web hook', async () => {
    const response = await checkWebhook(MOCK_SERVER_URL + '/notifications/test3')
    expect(response.body.location).toEqual(expect.stringContaining('/storage/' + pipelineId))
    expect(response.body.timestamp).toBeDefined()
  }, TIMEOUT)

  test('Check stored data', async () => {
    const response = await request(STORAGE_URL).get('/' + pipelineId)
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')

    const expected = generateSourceData()
    expected.someField = 42
    expect(response.body[0].data).toEqual(expected)
  }, TIMEOUT)

  test('Delete transformation config', async () => {
    const response = await request(TRANSFORMATION_URL).delete(`/configs/${pipelineId}`).send()
    expect(response.status).toEqual(204)
  }, TIMEOUT)

  test('Delete adapter config', async () => {
    const response = await request(ADAPTER_URL).delete(`/datasources/${dataSourceId}`).send()
    expect(response.status).toEqual(204)
  }, TIMEOUT)
})
