const request = require('supertest')
const {
  ALL_SERVICES,
  DOCKER_COMPOSE_FILES,
  DOCKER_ENV_FILE,
  STORAGE_URL,
  ADAPTER_URL,
  PIPELINE_URL,
  NOTIFICATION_URL,
  MOCK_SERVER_URL,
  MOCK_SERVER_WITHIN_DOCKER
} = require('./util/env')
const {
  sleep,
  generateDataSourceConfig,
  generatePipelineConfig,
  generateSourceData, checkWebhook
} = require('./util/testHelper')
const { DockerCompose, writeDockerLogs } = require('./util/docker-compose')

const SETUP_TIMEOUT = 60000
const TEST_TIMEOUT = 60000

let dataSourceConfig = null

let dataSourceId = -1
let pipelineId = -1

describe('Test 2: Create periodic pipeline without transformation', () => {
  afterAll(async () => {
    try {
      const dockerCompose = DockerCompose(DOCKER_COMPOSE_FILES, DOCKER_ENV_FILE)
      await writeDockerLogs(dockerCompose, ALL_SERVICES)
    } catch (error) {
      console.log('Failed to save logs', error)
    }

    await Promise.all([
      request(ADAPTER_URL).delete('/').send(),
      request(PIPELINE_URL).delete('/configs').send(),
      request(MOCK_SERVER_URL).delete('/').send()
    ])
  }, SETUP_TIMEOUT)

  test('Prepare Mock', async () => {
    const response = await request(MOCK_SERVER_URL).post('/sequences/test2').send(generateSourceData())
    expect(response.status).toEqual(201)
    dataSourceConfig = generateDataSourceConfig(MOCK_SERVER_WITHIN_DOCKER + '/sequences/test2', true, 5000)
  }, TEST_TIMEOUT)

  test('Create DataSource at adapter service', async () => {
    const response = await request(ADAPTER_URL).post('/datasources').send(dataSourceConfig)
    expect(response.status).toEqual(201)

    dataSourceId = response.body.id
    expect(dataSourceId).toBeGreaterThan(0)
  }, TEST_TIMEOUT)

  test('Add pipeline to DataSource', async () => {
    const pipelineConfig = generatePipelineConfig(dataSourceId)
    const response = await request(PIPELINE_URL).post('/configs').send(pipelineConfig)
    expect(response.status).toEqual(201)

    pipelineId = response.body.id
    expect(pipelineId).toBeGreaterThan(0)
  }, TEST_TIMEOUT)

  test('Create notification', async () => {
    const notificationConfig = {
      type: 'WEBHOOK',
      pipelineId: pipelineId,
      condition: 'data.count <= 2',
      parameter: {
        url: MOCK_SERVER_WITHIN_DOCKER + '/notifications/test2'
      }
    }

    const response = await request(NOTIFICATION_URL).post('/configs').send(notificationConfig)
    expect(response.status).toEqual(201)
    expect(response.body.id).toBeGreaterThan(0)
  }, TEST_TIMEOUT)

  test('Check notification web hook', async () => {
    const response = await checkWebhook(MOCK_SERVER_URL + '/notifications/test2')
    expect(response.body.timestamp).toBeDefined()
    expect(response.body.location).toEqual(expect.stringContaining('/storage/' + pipelineId))
  }, TEST_TIMEOUT)

  test('Check notification web hook for second notification', async () => {
    await sleep(5000)
    const response = await checkWebhook(MOCK_SERVER_URL + '/notifications/test2')
    expect(response.body.location).toBeDefined()
    expect(response.body.timestamp).toBeDefined()
  }, TEST_TIMEOUT)

  test('Check stored data', async () => {
    const response = await request(STORAGE_URL).get('/' + pipelineId)
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body.length).toBeGreaterThan(1)

    const sourceData = generateSourceData()
    expect(response.body[0].data).toEqual(expect.objectContaining(sourceData))
    expect(response.body[0].data.count).toEqual(0)
    expect(response.body[1].data).toEqual(expect.objectContaining(sourceData))
    expect(response.body[1].data.count).toEqual(1)
  }, TEST_TIMEOUT)

  test('Delete pipeline config', async () => {
    const response = await request(PIPELINE_URL).delete(`/configs/${pipelineId}`).send()
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body.id).toEqual(pipelineId)
  }, TEST_TIMEOUT)

  test('Delete adapter config', async () => {
    const response = await request(ADAPTER_URL).delete(`/datasources/${dataSourceId}`).send()
    expect(response.status).toEqual(204)
  }, TEST_TIMEOUT)
})
