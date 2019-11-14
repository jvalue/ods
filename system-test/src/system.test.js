const request = require('supertest')
const waitOn = require('wait-on')

const CORE_URL = process.env.CORE_API || 'http://localhost:9000/core'
const STORAGE_URL = process.env.STORAGE_API || 'http://localhost:9000/storage'
const SCHEDULER_URL = process.env.SCHEDULER_API || 'http://localhost:9000/scheduler'
const ADAPTER_URL = process.env.ADAPTER_API || 'http://localhost:9000/adapter'
const TRANSFORMATION_URL = process.env.TRANSFORMATION_API || 'http://localhost:9000/transformation'
const MOCK_SERVER_URL = process.env.MOCK_SERVER_API || 'http://localhost:9000/mock-server'

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
    let notification = generateNotification('data.one === 1', MOCK_SERVER_DOCKER+'/notifications/test1')
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
    expect(webhookResponse.body.location).toEqual(STORAGE_URL+'/'+pipelineId)
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

    const notification = generateNotification('data.count < 2', MOCK_SERVER_URL+'/notifications/test2')
    let pipelineConfig = generateConfig(MOCK_SERVER_URL+'/sequences/test2', true, 3000)
    pipelineConfig.notifications = [notification]

    console.log(`Test 2: Trying to create pipeline: ${JSON.stringify(pipelineConfig)}`)

    // Add pipeline to core service
    const pipelineResponse = await request(CORE_URL)
      .post('/pipelines')
      .send(pipelineConfig)
    const pipelineId = pipelineResponse.body.id

    // Wait for exactly three executions of the pipeline
    await sleep(10000)

    // Remove periodic pipeline from ods-core
    const deletionResponse = await request(CORE_URL)
      .delete(`/pipelines/${pipelineId}`)
      .send()
    console.log(`Test 2: Pipeline ${pipelineId} should have been executed three times. Deletion request triggered.`)

    expect(deletionResponse.status).toEqual(204)

    // Check if data has been stored correctly
    const storageResponse = await request(STORAGE_URL)
      .get('/'+pipelineId)
    expect(storageResponse.status).toEqual(200)
    expect(storageResponse.type).toEqual('application/json')
    console.log(`Test 2: Storage response response body: ${JSON.stringify(storageResponse.body)}`)
    expect(storageResponse.body.length).toEqual(3)
    expect(storageResponse.body[0].data).toEqual(expect.objectContaining(sourceData))
    expect(storageResponse.body[0].data.count).toEqual(0)
    expect(storageResponse.body[1].data.count).toEqual(1)
    expect(storageResponse.body[2].data.count).toEqual(2)

    // Check if webhooks have been triggered correctly
    const webhookResponse = await request(MOCK_SERVER_URL)
      .get('/sequences/test2')
    expect(webhookResponse.status).toEqual(200)
    expect(webhookResponse.type).toEqual('application/json')
    console.log(`Test 2: Webhook response body ${JSON.stringify(webhookResponse.body)}`)
    expect(webhookResponse.body.length).toEqual(2)
    expect(webhookResponse.body[0].location).toEqual(STORAGE_URL+'/'+pipelineId)
    expect(webhookResponse.body[0].timestamp).toBeDefined()
    expect(webhookResponse.body[1].location).toEqual(STORAGE_URL+'/'+pipelineId)
    expect(webhookResponse.body[1].timestamp).toBeDefined()
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
    const notification = generateNotification('data.newField === 12',MOCK_SERVER_URL+'/notifications/test3')
    let pipelineConfig = generateConfig(MOCK_SERVER_URL+'/data/test3',false)
    pipelineConfig.transformations = [{"func": "data.one = data.one + 1;return data;"}, {"func": "data.newField = 12;return data;"}, {"func": "delete data.objecticus;return data;"}]
    pipelineConfig.notifications = [notification]

    console.log(`Test 3: Trying to create pipeline: ${JSON.stringify(pipelineConfig)}`)

    // Add pipeline to core service
    const pipelineResponse = await request(CORE_URL)
      .post('/pipelines')
      .send(pipelineConfig)
    const pipelineId = pipelineResponse.body.id

    // Wait for webhook notification
    const webhookResponse = await checkWebhook('/test3', 1000)
    console.log(`Test 3: Webhook response body: ${JSON.stringify(webhookResponse.body)}`)
    expect(webhookResponse.body.location).toEqual(STORAGE_URL+'/'+pipelineId)
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

    let pipelineConfig = generateConfig(
      MOCK_SERVER_URL+'/data/test4',true)
    pipelineConfig.notifications = []
    pipelineConfig.trigger.interval = 8000

    console.log(`Test 4: Trying to create pipeline: ${JSON.stringify(pipelineConfig)}`)

    // Add pipeline to core service
    const pipelineResponse = await request(CORE_URL)
      .post('/pipelines')
      .send(pipelineConfig)
    const pipelineId = pipelineResponse.body.id

    // Wait for one execution of the pipeline
    await sleep(6000)

    // Check if data was stored correctly
    const storageResponse = await request(STORAGE_URL)
      .get(`/${pipelineId}`)
    expect(storageResponse.status).toEqual(200)
    console.log(`Test 4: Storage response body ${JSON.stringify(storageResponse.body)}`)
    expect(storageResponse.body.length).toEqual(1)
    expect(storageResponse.body[0].data).toEqual(sourceData)

    // Create updated pipeline
    pipelineConfig.id = pipelineId
    const notification = generateNotification('data.two === \"two\"', MOCK_SERVER_URL+'/notifications/test4')
    pipelineConfig.notifications = [notification]
    pipelineConfig.adapter.location = MOCK_SERVER_URL+'/data/test4_updated'

    console.log(`Test 4: Pipeline ${pipelineId} should have been executed once. Update request triggered.`)
    // Update pipeline
    const updateResponse = await request(CORE_URL)
      .put(`/pipelines/${pipelineId}`)
      .send(pipelineConfig)
    expect(updateResponse.status).toEqual(204)

    // Wait for another execution
    await sleep(10000)

    console.log(`Test 4: Removing pipeline ${pipelineId} after second execution.`)
    const deletionResponse = await request(CORE_URL)
      .delete(`/pipelines/${pipelineId}`)
      .send()
    expect(deletionResponse.status).toEqual(204)

    // Check if data has been stored correctly
    const updatedStorageResponse = await request(STORAGE_URL)
      .get('/'+pipelineId)
    expect(updatedStorageResponse.status).toEqual(200)
    console.log(`Test 4: Updated storage response body ${JSON.stringify(updatedStorageResponse.body)}`)
    expect(updatedStorageResponse.body.length).toEqual(2)
    expect(updatedStorageResponse.body[0].data).toEqual(sourceData)
    expect(updatedStorageResponse.body[1].data).toEqual(updatedSourceData)

    // Check if webhook was triggered
    const webhookResponse = await request(MOCK_SERVER_URL)
      .get('/notifications/test4')
    expect(webhookResponse.status).toEqual(200)
    console.log(`Test 4: Webhook response body ${JSON.stringify(webhookResponse.body)}`)
    expect(webhookResponse.body.location).toEqual(STORAGE_URL+'/'+pipelineId)
    expect(webhookResponse.body.timestamp).toBeDefined()
  }, 20000)

  test('Test 5: Create pipeline with multiple notifications', async () => {
    // Prepare datasource mock
    await request(MOCK_SERVER_URL)
      .post('/data/test5')
      .send(sourceData)

    let pipelineConfig = generateConfig(MOCK_SERVER_URL+'/data/test5', false)
    const notification1 = generateNotification('data.one === 1', MOCK_SERVER_URL+'/notifications/test5_1')
    const notification2 = generateNotification('data.one === 1', MOCK_SERVER_URL+'/notifications/test5_2')
    const notification3 = generateNotification('data.one < 1', MOCK_SERVER_URL+'/notifications/test5_3')
    pipelineConfig.notifications = [notification1, notification2, notification3]

    console.log(`Test 5: Trying to create pipeline: ${JSON.stringify(pipelineConfig)}`)

    // Add pipeline to core service
    const pipelineResponse = await request(CORE_URL)
      .post('/pipelines')
      .send(pipelineConfig)
    const pipelineId = pipelineResponse.body.id

    // Give the ODS time to process the pipeline
    await sleep(6000)

    // Check if data has been stored correctly
    const storageResponse = await request(STORAGE_URL)
      .get('/'+pipelineId)
    expect(storageResponse.status).toEqual(200)
    expect(storageResponse.type).toEqual('application/json')
    console.log(`Test 5: Storage response body: ${JSON.stringify(storageResponse.body)}`)
    expect(storageResponse.body[0].data).toEqual(sourceData)

    // Check if webhooks were triggered
    const webhookResponse1 = await request(MOCK_SERVER_URL)
      .get('/notifications/test5_1')
    expect(webhookResponse1.status).toEqual(200)
    expect(webhookResponse1.type).toEqual('application/json')
    expect(webhookResponse1.body.location).toEqual(STORAGE_URL+'/'+pipelineId)
    expect(webhookResponse1.body.timestamp).toBeDefined()

    const webhookResponse2 = await request(MOCK_SERVER_URL)
      .get('/notifications/test5_2')
    expect(webhookResponse2.status).toEqual(200)
    expect(webhookResponse2.type).toEqual('application/json')
    expect(webhookResponse2.body.location).toEqual(STORAGE_URL+'/'+pipelineId)
    expect(webhookResponse2.body.timestamp).toBeDefined()

    // Check if webhooks were triggered
    const webhookResponse3 = await request(MOCK_SERVER_URL)
      .get('/notifications/test5_3')
    expect(webhookResponse3.status).toEqual(404)
  }, 10000)

  test('Test 6: Delete periodic pipeline', async () => {
    // Prepare datasource mock
    await request(MOCK_SERVER_URL)
      .post('/sequences/test6')
      .send(sourceData)

    const notification = generateNotification('data.two === "two"', MOCK_SERVER_URL+'/sequences/test6')
    let pipelineConfig = generateConfig(MOCK_SERVER_URL+'/sequences/test6', true, 5000)
    pipelineConfig.notifications = [notification]

    console.log(`Test 6: Trying to create pipeline: ${JSON.stringify(pipelineConfig)}`)

    // Add pipeline to core service
    const pipelineResponse = await request(CORE_URL)
      .post('/pipelines')
      .send(pipelineConfig)
    const pipelineId = pipelineResponse.body.id

    // Wait for one execution of the pipeline
    await sleep(4000)

    // Remove periodic pipeline from ods-core
    const deletionResponse = await request(CORE_URL)
      .delete(`/pipelines/${pipelineId}`)
      .send()
    expect(deletionResponse.status).toEqual(204)
    console.log(`Test 6: Pipeline ${pipelineId} should have been executed once. Deletion request triggered.`)

    // Wait to check if pipeline really stopped executing

    // Check if data has been stored correctly
    const storageResponse = await request(STORAGE_URL)
      .get('/'+pipelineId)
    expect(storageResponse.status).toEqual(200)
    expect(storageResponse.type).toEqual('application/json')
    console.log(`Test 6: Storage response response body: ${JSON.stringify(storageResponse.body)}`)
    expect(storageResponse.body.length).toEqual(1)
    expect(storageResponse.body[0].data).toEqual(expect.objectContaining(sourceData))
    expect(storageResponse.body[0].data.count).toEqual(0)

    // Check if webhook has been triggered correctly
    const webhookResponse = await request(MOCK_SERVER_URL)
      .get('/sequences/test6')
    expect(webhookResponse.status).toEqual(200)
    expect(webhookResponse.type).toEqual('application/json')
    console.log(`Test 6: Webhook response body ${JSON.stringify(webhookResponse.body)}`)
    expect(webhookResponse.body.length).toEqual(1)
    expect(webhookResponse.body[0].location).toEqual(STORAGE_URL+'/'+pipelineId)
    expect(webhookResponse.body[0].timestamp).toBeDefined()
  })
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
  for(let i = 0; i < maxRetries; i++) {
    const response = await request(MOCK_SERVER_URL)
      .get(`/notifications/${uri}`)
    if(response.status === 200) {
      return response
    } else {
      await sleep(pollingInterval)
    }
  }
}
