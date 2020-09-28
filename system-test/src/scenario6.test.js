const request = require('supertest')
const {
  ADAPTER_URL,
  TRANSFORMATION_URL,
  NOTIFICATION_URL,
  MOCK_SERVER_URL,
  MOCK_SERVER_WITHIN_DOCKER
} = require('./env')
const {
  generateDataSourceConfig,
  generatePipelineConfig,
  generateSourceData, checkWebhook, sleep
} = require('./testHelper')
const { waitForServicesToBeReady } = require('./waitForServices')

const TIMEOUT = 60000

let dataSourceConfig = null

let dataSourceId = -1
let pipelineId = -1

describe('Test 6: Delete periodic pipeline', () => {
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
    const response = await request(MOCK_SERVER_URL).post('/data/test6').send(generateSourceData())
    expect(response.status).toEqual(201)
    dataSourceConfig = generateDataSourceConfig(MOCK_SERVER_WITHIN_DOCKER + '/data/test6', false, 20000)
  }, TIMEOUT)

  test('Create DataSource at adapter service', async () => {
    const response = await request(ADAPTER_URL).post('/datasources').send(dataSourceConfig)
    expect(response.status).toEqual(201)

    dataSourceId = response.body.id
    expect(dataSourceId).toBeGreaterThan(0)
  }, TIMEOUT)

  test('Add pipeline to DataSource', async () => {
    const pipelineConfig = generatePipelineConfig(dataSourceId)
    const response = await request(TRANSFORMATION_URL).post('/configs').send(pipelineConfig)
    expect(response.status).toEqual(201)

    pipelineId = response.body.id
    expect(pipelineId).toBeGreaterThan(0)
  }, TIMEOUT)

  test('Create notification', async () => {
    const notificationConfig = {
      condition: 'data.one === 1',
      url: MOCK_SERVER_WITHIN_DOCKER + '/notifications/test6',
      pipelineId: pipelineId
    }

    const response = await request(NOTIFICATION_URL).post('/config/webhook').send(notificationConfig)
    expect(response.status).toEqual(201)
    expect(response.body.id).toBeGreaterThan(0)
  }, TIMEOUT)

  test('Check notification web hook', async () => {
    const response = await checkWebhook(MOCK_SERVER_URL + '/notifications/test6')
    expect(response.body.location).toEqual(expect.stringContaining('/storage/' + pipelineId))
    expect(response.body.timestamp).toBeDefined()
  }, TIMEOUT)

  test('Delete transformation config', async () => {
    const response = await request(TRANSFORMATION_URL).delete(`/configs/${pipelineId}`).send()
    expect(response.status).toEqual(204)
  }, TIMEOUT)

  test('Notification webhook does not return new data', async () => {
    const waitForSchedule = 2000
    await sleep(waitForSchedule)
    const firstResponse = await request(MOCK_SERVER_URL).get('/notifications/test6')

    await sleep(waitForSchedule)
    const secondResponse = await request(MOCK_SERVER_URL).get('/notifications/test6')
    expect(firstResponse.body).toEqual(secondResponse.body)
  })

  test('Delete adapter config', async () => {
    const response = await request(ADAPTER_URL).delete(`/datasources/${dataSourceId}`).send()
    expect(response.status).toEqual(204)
  }, TIMEOUT)
})
