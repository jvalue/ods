const request = require('supertest')
const waitOn = require('wait-on')

const CORE_URL = process.env.CORE_API || 'http://localhost:9000/api/core'
const STORAGE_URL = process.env.STORAGE_API || 'http://localhost:9000/api/storage'
const SCHEDULER_URL = process.env.SCHEDULER_API || 'http://localhost:9000/api/scheduler'
const ADAPTER_URL = process.env.ADAPTER_API || 'http://localhost:9000/api/adapter'
const TRANSFORMATION_URL = process.env.TRANSFORMATION_API || 'http://localhost:9000/api/transformation'
const MOCK_SERVER_URL = process.env.MOCK_SERVER_API || 'http://localhost:9000/mock-server'

const STORAGE_DOCKER = process.env.STORAGE_API || 'http://storage-service:3000' // needed to run tests outside of docker environment
const MOCK_SERVER_DOCKER = process.env.MOCK_SERVER_API || 'http://mock-server:8080'

const sourceData = {
  one: 1,
  two: "two",
  objecticus: {
    inner: "value"
  }
}

describe('System-Test', () => {

  beforeAll(async () => {
    console.log('Waiting for core-service with URL: ' + CORE_URL)
    console.log('Waiting for scheduler-service with URL: ' + SCHEDULER_URL)
    console.log('Waiting for transformation-service with URL: ' + TRANSFORMATION_URL)
    console.log('Waiting for adapter-service with URL: ' + ADAPTER_URL)
    console.log('Waiting for storage-service with URL: ' + STORAGE_URL)
    console.log('Waiting for mock server with URL: ' + MOCK_SERVER_URL)
    await waitOn(
      { resources:
      [STORAGE_URL,
      CORE_URL + '/version',
      SCHEDULER_URL,
      TRANSFORMATION_URL,
      ADAPTER_URL + '/version',
      MOCK_SERVER_URL
      ], timeout: 10000 })
  }, 12000)

  afterAll(async () => {
    console.log('All tests done, removing pipelines from ods.')
    await request(CORE_URL)
      .delete('/')
      .send()
    console.log('Deletion triggered.')
  })

  test('Test 1: Create non-periodic pipeline without transformations', async () => {
    // Prepare datasource mock
    await request(MOCK_SERVER_URL)
      .post('/data/test1')
      .send(sourceData)

    const pipelineConfig = generateConfig(MOCK_SERVER_DOCKER+'/data/test1', false)
    const notification = generateNotification('data.one === 1', MOCK_SERVER_DOCKER+'/notifications/test1')
    pipelineConfig.notifications = [notification]

    console.log(`Test 1: Trying to create pipeline: ${JSON.stringify(pipelineConfig)}`)

    // Add pipeline to core service
    const pipelineResponse = await request(CORE_URL)
      .post('/pipelines')
      .send(pipelineConfig)
    const pipelineId = pipelineResponse.body.id

    // Wait for webhook notification
    const webhookResponse = await checkWebhook('test1', 1000)
    console.log(`Test 1: Webhook response body: ${JSON.stringify(webhookResponse.body)}`)
    expect(webhookResponse.body.location).toEqual(STORAGE_DOCKER+'/'+pipelineId)
    expect(webhookResponse.body.timestamp).toBeDefined()

    // Check if data has been stored correctly
    const storageResponse = await request(STORAGE_URL)
      .get('/'+pipelineId)
    expect(storageResponse.status).toEqual(200)
    expect(storageResponse.type).toEqual('application/json')
    console.log(`Test 1: Storage response body: ${JSON.stringify(storageResponse.body)}`)
    expect(storageResponse.body[0].data).toEqual(sourceData)

  }, 10000)

  test('Test 2: Create periodic pipeline without transformations', async () => {
    // Prepare datasource mock
    await request(MOCK_SERVER_URL)
      .post('/sequences/test2')
      .send(sourceData)

    const notification = generateNotification('data.count < 2', MOCK_SERVER_DOCKER+'/notifications/test2')
    const pipelineConfig = generateConfig(MOCK_SERVER_DOCKER+'/sequences/test2', true, 5000)
    pipelineConfig.notifications = [notification]

    console.log(`Test 2: Trying to create pipeline: ${JSON.stringify(pipelineConfig)}`)

    // Add pipeline to core service
    const pipelineResponse = await request(CORE_URL)
      .post('/pipelines')
      .send(pipelineConfig)
    const pipelineId = pipelineResponse.body.id

    // Wait for webhook notification
    const webhookResponse = await checkWebhook('test2', 1000)
    console.log(`Test 2: Webhook response body ${JSON.stringify(webhookResponse.body)}`)
    expect(webhookResponse.body.location).toEqual(STORAGE_DOCKER+'/'+pipelineId)
    expect(webhookResponse.body.timestamp).toBeDefined()

    // Wait for second notification
    const changedWebhook = await waitForWebhookChange('test2', webhookResponse.body, 1000)
    console.log(`Test 2: Changed webhook response body ${JSON.stringify(changedWebhook.body)}`)
    expect(webhookResponse.body.location).toEqual(STORAGE_DOCKER+'/'+pipelineId)
    expect(webhookResponse.body.timestamp).toBeDefined()

    // Check if data has been stored correctly
    const storageResponse = await request(STORAGE_URL)
      .get('/'+pipelineId)
    expect(storageResponse.status).toEqual(200)
    console.log(`Test 2: Storage response response body: ${JSON.stringify(storageResponse.body)}`)
    expect(storageResponse.body.length).toBeGreaterThan(1)
    expect(storageResponse.body[0].data).toEqual(expect.objectContaining(sourceData))
    expect(storageResponse.body[0].data.count).toEqual(0)
    expect(storageResponse.body[1].data).toEqual(expect.objectContaining(sourceData))
    expect(storageResponse.body[1].data.count).toEqual(1)

    // Remove periodic pipeline from ods-core
    const deletionResponse = await request(CORE_URL)
      .delete(`/pipelines/${pipelineId}`)
      .send()
    console.log(`Test 2: Pipeline deletion request triggered.`)

    expect(deletionResponse.status).toEqual(204)

  }, 20000)

  test('Test 3: Create non-periodic pipeline with transformations', async () => {
    // Prepare datasource mock
    await request(MOCK_SERVER_URL)
      .post('/data/test3')
      .send(sourceData)

    const expectedData = {
      one: 2,
      two: "two",
      newField: 12
    }
    const notification = generateNotification('data.newField === 12',MOCK_SERVER_DOCKER+'/notifications/test3')
    const pipelineConfig = generateConfig(MOCK_SERVER_DOCKER+'/data/test3',false)
    pipelineConfig.transformations = [{"func": "data.one = data.one + 1;return data;"}, {"func": "data.newField = 12;return data;"}, {"func": "delete data.objecticus;return data;"}]
    pipelineConfig.notifications = [notification]

    console.log(`Test 3: Trying to create pipeline: ${JSON.stringify(pipelineConfig)}`)

    // Add pipeline to core service
    const pipelineResponse = await request(CORE_URL)
      .post('/pipelines')
      .send(pipelineConfig)
    const pipelineId = pipelineResponse.body.id

    // Wait for webhook notification
    const webhookResponse = await checkWebhook('test3', 1000)
    console.log(`Test 3: Webhook response body: ${JSON.stringify(webhookResponse.body)}`)
    expect(webhookResponse.body.location).toEqual(STORAGE_DOCKER+'/'+pipelineId)
    expect(webhookResponse.body.timestamp).toBeDefined()

    // Check if data has been stored correctly
    const storageResponse = await request(STORAGE_URL)
      .get('/'+pipelineId)
    expect(storageResponse.status).toEqual(200)
    expect(storageResponse.type).toEqual('application/json')
    console.log(`Test 3: Storage response body: ${JSON.stringify(storageResponse.body)}`)
    expect(storageResponse.body[0].data).toEqual(expectedData)

  }, 10000)

  test('Test 4: Update periodic pipeline', async () => {
    // Prepare datasource mock
    await request(MOCK_SERVER_URL)
      .post('/data/test4')
      .send(sourceData)
    const updatedSourceData = Object.assign({}, sourceData)
    updatedSourceData.one = 2
    await request(MOCK_SERVER_URL)
      .post('/data/test4_updated')
      .send(updatedSourceData)

    const notification = generateNotification('data.one === 1', MOCK_SERVER_DOCKER+'/notifications/test4_1')
    const pipelineConfig = generateConfig(MOCK_SERVER_DOCKER+'/data/test4',true)
    pipelineConfig.notifications = [notification]

    console.log(`Test 4: Trying to create pipeline: ${JSON.stringify(pipelineConfig)}`)

    // Add pipeline to core service
    const pipelineResponse = await request(CORE_URL)
      .post('/pipelines')
      .send(pipelineConfig)
    const pipelineId = pipelineResponse.body.id

    // Wait for webhook notification
    const webhookResponse = await checkWebhook('test4_1', 1000)
    console.log(`Test 4: Webhook response body ${JSON.stringify(webhookResponse.body)}`)
    expect(webhookResponse.body.location).toEqual(STORAGE_DOCKER+'/'+pipelineId)
    expect(webhookResponse.body.timestamp).toBeDefined()

    // Check if data was stored correctly
    const storageResponse = await request(STORAGE_URL)
      .get(`/${pipelineId}`)
    expect(storageResponse.status).toEqual(200)
    console.log(`Test 4: Storage response body ${JSON.stringify(storageResponse.body)}`)
    expect(storageResponse.body[0].data).toEqual(sourceData)

    // Create updated pipeline
    pipelineConfig.id = pipelineId
    const anotherNotification = generateNotification('data.two === \"two\"', MOCK_SERVER_DOCKER+'/notifications/test4_2')
    pipelineConfig.notifications = [notification, anotherNotification]
    pipelineConfig.adapter.location = MOCK_SERVER_DOCKER+'/data/test4_updated'

    console.log(`Test 4: Pipeline ${pipelineId} update request triggered.`)
    // Update pipeline
    const updateResponse = await request(CORE_URL)
      .put(`/pipelines/${pipelineId}`)
      .send(pipelineConfig)
    expect(updateResponse.status).toEqual(204)

    // Wait for webhook notification
    const secondWebhook = await checkWebhook('test4_2', 1000)
    expect(secondWebhook.body.location).toEqual(STORAGE_DOCKER+'/'+pipelineId)
    expect(secondWebhook.body.timestamp).toBeDefined()

    // Check if data has been stored correctly
    const updatedStorageResponse = await request(STORAGE_URL)
      .get('/'+pipelineId)

    expect(updatedStorageResponse.status).toEqual(200)
    console.log(`Test 4: Updated storage response body ${JSON.stringify(updatedStorageResponse.body)}`)
    expect(updatedStorageResponse.body.length).toBeGreaterThan(1)
    const dataArray = updatedStorageResponse.body.map( b => b.data)
    expect(dataArray[0]).toEqual(sourceData)
    expect(dataArray).toContainEqual(updatedSourceData)

    console.log(`Test 4: Removing pipeline ${pipelineId} after test execution.`)
    const deletionResponse = await request(CORE_URL)
      .delete(`/pipelines/${pipelineId}`)
      .send()
    expect(deletionResponse.status).toEqual(204)

  }, 20000)

  test('Test 5: Create pipeline with multiple notifications', async () => {
    // Prepare datasource mock
    await request(MOCK_SERVER_URL)
      .post('/data/test5')
      .send(sourceData)

    const pipelineConfig = generateConfig(MOCK_SERVER_DOCKER+'/data/test5', false)
    const notification1 = generateNotification('data.one === 1', MOCK_SERVER_DOCKER+'/notifications/test5_1')
    const notification2 = generateNotification('data.one === 1', MOCK_SERVER_DOCKER+'/notifications/test5_2')
    const notification3 = generateNotification('data.one < 1', MOCK_SERVER_DOCKER+'/notifications/test5_3')
    pipelineConfig.notifications = [notification1, notification2, notification3]

    console.log(`Test 5: Trying to create pipeline: ${JSON.stringify(pipelineConfig)}`)

    // Add pipeline to core service
    const pipelineResponse = await request(CORE_URL)
      .post('/pipelines')
      .send(pipelineConfig)
    const pipelineId = pipelineResponse.body.id

    // Wait for webhook notification
    const webhookResponse1 = await checkWebhook('test5_1', 1000)
    expect(webhookResponse1.body.location).toEqual(STORAGE_DOCKER+'/'+pipelineId)
    expect(webhookResponse1.body.timestamp).toBeDefined()

    // Check if data has been stored correctly
    const storageResponse = await request(STORAGE_URL)
      .get('/'+pipelineId)
    expect(storageResponse.status).toEqual(200)
    expect(storageResponse.type).toEqual('application/json')
    console.log(`Test 5: Storage response body: ${JSON.stringify(storageResponse.body)}`)
    expect(storageResponse.body[0].data).toEqual(sourceData)

    // Check if second webhook was triggered as well
    const webhookResponse2 = await request(MOCK_SERVER_URL)
      .get('/notifications/test5_2')
    expect(webhookResponse2.status).toEqual(200)
    expect(webhookResponse2.body.location).toEqual(STORAGE_DOCKER+'/'+pipelineId)
    expect(webhookResponse2.body.timestamp).toBeDefined()

    // Check if third webhook was triggered
    const webhookResponse3 = await request(MOCK_SERVER_URL)
      .get('/notifications/test5_3')
    expect(webhookResponse3.status).toEqual(404)
  }, 10000)

  test('Test 6: Delete periodic pipeline', async () => {
    // Prepare dataource mock
    await request(MOCK_SERVER_URL)
      .post('/data/test6')
      .send(sourceData)

    const pipelineConfig = generateConfig(MOCK_SERVER_DOCKER+'/data/test6', true)
    const notification = generateNotification('data.one === 1', MOCK_SERVER_DOCKER+'/notifications/test6')
    pipelineConfig.notifications = [notification]

    console.log(`Test 6: Trying to create pipeline: ${JSON.stringify(pipelineConfig)}`)

    // Add pipeline to core service
    const pipelineResponse = await request(CORE_URL)
      .post('/pipelines')
      .send(pipelineConfig)
    const pipelineId = pipelineResponse.body.id

    // Wait for webhook notification
    const webhookResponse1 = await checkWebhook('test6', 1000)
    expect(webhookResponse1.body.location).toEqual(STORAGE_DOCKER+'/'+pipelineId)
    expect(webhookResponse1.body.timestamp).toBeDefined()

    // Delete pipeline from core service
    const deletionResponse = await request(CORE_URL)
      .delete(`/pipelines/${pipelineId}`)
    expect(deletionResponse.status).toEqual(204)
    console.log(`Test 6: Pipeline ${pipelineId} deletion request triggered`)

    expect(waitForWebhookChange('test6', webhookResponse1, 1000))
      .rejects.toThrow(`Webhook was not triggered within 10 retries.`)
  }, 15000)
})

function generateNotification(condition, url) {
  return {
    notificationType: "WEBHOOK",
    condition,
    url
  }
}

function generateConfig(sourceLocation, periodic, interval = 5000) {
  return {
    adapter: {
      protocol: "HTTP",
      format: "JSON",
      location: sourceLocation
    },
    transformations: [],
    trigger: {
      firstExecution: new Date(Date.now() + 2000),
      periodic,
      interval
    },
    metadata: {
      author: "Klaus Klausemeier",
      license: "AGPL v30",
      displayName: "test1",
      description: "system test 1"
    },
    notifications: [ ]
  }
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function checkWebhook(uri, pollingInterval, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await request(MOCK_SERVER_URL)
      .get(`/notifications/${uri}`)
    if (response.status === 200) {
      return response
    } else {
      await sleep(pollingInterval)
    }
  }
  await Promise.reject(`Webhook was not triggered within ${maxRetries} retries.`)
}

async function waitForWebhookChange(uri, original, pollingInterval, maxRetries = 10) {
  const timestamp = original.timestamp
  for (let i = 0; i < maxRetries; i++) {
    const response = await request(MOCK_SERVER_URL)
      .get(`/notifications/${uri}`)
    if (response.status === 200 && timestamp !== response.body.timestamp) {
      return response
    } else {
      await sleep(pollingInterval)
    }
  }
  await Promise.reject(`Webhook was not triggered within ${maxRetries} retries.`)
}
