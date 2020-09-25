
const request = require('supertest')
const waitOn = require('wait-on')
const {
  STORAGE_URL,
  SCHEDULER_URL,
  ADAPTER_URL,
  TRANSFORMATION_URL,
  NOTIFICATION_URL,
  MOCK_SERVER_URL,
  MOCK_SERVER_WITHIN_DOCKER,
  RABBIT_URL
} = require('./env')

const {
  sleep,
  generateDataSourceConfig,
  generatePipelineConfig,
  generateSourceData, checkWebhook
} = require('./testHelper')

const TIMEOUT = 60000
// This startup delay ensures that the scheduler will be reachable
const STARTUP_DELAY = 2000

let dataSourceConfig = null

const notificationConfig = {
  condition: 'data.one === 1',
  url: MOCK_SERVER_WITHIN_DOCKER + '/notifications/test4_1',
  pipelineId: -1
}

let dataSourceId = -1
let pipelineId = -1
let notificationId = -1

async function waitForServicesToBeReady () {
  const waitOptions = {
    resources: [
      STORAGE_URL,
      SCHEDULER_URL,
      TRANSFORMATION_URL,
      NOTIFICATION_URL + '/',
      ADAPTER_URL + '/version',
      MOCK_SERVER_URL + '/',
      RABBIT_URL
    ],
    timeout: TIMEOUT,
    log: true
  }

  await waitOn(waitOptions)
  await sleep(STARTUP_DELAY)
}

describe('Test 4: Update periodic datasource with pipeline', () => {
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
    const response = await request(MOCK_SERVER_URL).post('/data/test4').send(generateSourceData())
    expect(response.status).toEqual(201)

    const updatedSD = generateSourceData()
    updatedSD.one = 2
    const responseUpd = await request(MOCK_SERVER_URL).post('/data/test4_updated').send(updatedSD)
    expect(responseUpd.status).toEqual(201)

    dataSourceConfig = generateDataSourceConfig(MOCK_SERVER_WITHIN_DOCKER + '/data/test4', false)
  }, TIMEOUT)

  test('Create DataSource at adapter service', async () => {
    const adapterResponse = await request(ADAPTER_URL).post('/datasources').send(dataSourceConfig)
    expect(adapterResponse.status).toEqual(201)

    dataSourceId = adapterResponse.body.id
    expect(dataSourceId).toBeGreaterThan(0)
  }, TIMEOUT)

  test('Add pipeline to DataSource', async () => {
    const pipelineConfig = generatePipelineConfig(dataSourceId)
    const pipelineResponse = await request(TRANSFORMATION_URL).post('/configs').send(pipelineConfig)
    expect(pipelineResponse.status).toEqual(201)

    pipelineId = pipelineResponse.body.id
    expect(pipelineId).toBeGreaterThan(0)
  }, TIMEOUT)

  test('Create notification', async () => {
    notificationConfig.pipelineId = pipelineId

    const notificationResponse = await request(NOTIFICATION_URL).post('/config/webhook').send(notificationConfig)
    expect(notificationResponse.status).toEqual(201)

    notificationId = notificationResponse.body.id
    expect(notificationId).toBeGreaterThan(0)
  }, TIMEOUT)

  test('Check notification web hook', async () => {
    const webhookResponse = await checkWebhook(MOCK_SERVER_URL + '/notifications/test4_1')
    expect(webhookResponse.body.location).toEqual(expect.stringContaining('/storage/' + pipelineId))
    expect(webhookResponse.body.timestamp).toBeDefined()
  }, TIMEOUT)

  test('Check stored data', async () => {
    const storageResponse = await request(STORAGE_URL).get('/' + pipelineId)
    expect(storageResponse.status).toEqual(200)
    expect(storageResponse.type).toEqual('application/json')
    expect(storageResponse.body[0].data).toEqual(generateSourceData())
  }, TIMEOUT)

  test('Update datasource', async () => {
    dataSourceConfig.id = dataSourceId
    dataSourceConfig.protocol.parameters.location = MOCK_SERVER_WITHIN_DOCKER + '/data/test4_updated'
    const updateResponse = await request(ADAPTER_URL).put(`/datasources/${dataSourceId}`).send(dataSourceConfig)
    expect(updateResponse.status).toEqual(204)
  })

  test('Update pipeline', async () => {
    const pipelineConfig = generatePipelineConfig(dataSourceId)
    pipelineConfig.id = pipelineId

    const updateResponse = await request(TRANSFORMATION_URL).put(`/configs/${pipelineId}`).send(pipelineConfig)
    expect(updateResponse.status).toEqual(204)
  })

  test('Add second notification', async () => {
    const secondNotificationCfg = {
      pipelineId: pipelineId,
      condition: 'data.two === "two"',
      url: MOCK_SERVER_WITHIN_DOCKER + '/notifications/test4_2'
    }

    const notificationResponse = await request(NOTIFICATION_URL).post('/config/webhook').send(secondNotificationCfg)
    expect(notificationResponse.status).toEqual(201)

    const secondNotificationId = notificationResponse.body.id
    expect(secondNotificationId).toBeGreaterThan(0)
  })

  test('Check second notification web hook', async () => {
    const webhookResponse = await checkWebhook(MOCK_SERVER_URL + '/notifications/test4_2')
    expect(webhookResponse.body.location).toEqual(expect.stringContaining('/storage/' + pipelineId))
    expect(webhookResponse.body.timestamp).toBeDefined()
  }, TIMEOUT)

  test('Delete transformation config', async () => {
    const deletionResponse = await request(TRANSFORMATION_URL).delete(`/configs/${pipelineId}`).send()
    expect(deletionResponse.status).toEqual(204)
  }, TIMEOUT)

  test('Delete adapter config', async () => {
    const deletionResponse = await request(ADAPTER_URL).delete(`/datasources/${dataSourceId}`).send()
    expect(deletionResponse.status).toEqual(204)
  }, TIMEOUT)
})
