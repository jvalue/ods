const request = require('supertest')
const waitOn = require('wait-on')

const CORE_URL = process.env.CORE_API || 'http://localhost:9000/core'
const STORAGE_URL = process.env.STORAGE_API || 'http://localhost:9000/storage'
const SCHEDULER_URL = process.env.SCHEDULER_API || 'http://localhost:9000/scheduler'
const ADAPTER_URL = process.env.ADAPTER_API || 'http://localhost:9000/adapter'
const TRANSFORMATION_URL = process.env.TRANSFORMATION_API || 'http://localhost:9000/transformation'

const MOCK_RECEIVER_PORT = process.env.MOCK_RECEIVER_PORT || 8081
const MOCK_RECEIVER_HOST = process.env.MOCK_RECEIVER_HOST || 'localhost'
const MOCK_RECEIVER_URL = 'http://' + MOCK_RECEIVER_HOST + ':' + MOCK_RECEIVER_PORT

const MOCK_SOURCE_PORT = process.env.MOCK_SOURCE_PORT || 8082
const MOCK_SOURCE_HOST = process.env.MOCK_SOURCE_HOST || 'localhost'
const MOCK_SOURCE_URL = 'http://' + MOCK_SOURCE_HOST + ':' + MOCK_SOURCE_PORT

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
    console.log('Waiting for storage-service with URL: ' + STORAGE_URL)
    console.log('Waiting for notification receiver mock with URL: ' + MOCK_RECEIVER_URL)
    console.log('Waiting for data source mock with URL: ' + MOCK_SOURCE_URL)
    await waitOn(
      { resources:
      [STORAGE_URL,
      CORE_URL + '/version',
      SCHEDULER_URL,
      TRANSFORMATION_URL,
      ADAPTER_URL,
      MOCK_SOURCE_URL,
      MOCK_RECEIVER_URL], timeout: 10000 })
  }, 12000)

  test('Create non-periodic pipeline without transformations', async () => {
    // Prepare datasource mock
    await request(MOCK_SOURCE_URL)
      .post('/first')
      .send(sourceData)

    const executionDate = new Date(Date.now() + 2000)
    const notificationCondition = 'data.one === 1'
    const pipelineConfig = generateConfig(
      MOCK_SOURCE_URL+'/first', executionDate, notificationCondition, MOCK_RECEIVER_URL+'/first')

    console.log(`Trying to create pipeline: ${JSON.stringify(pipelineConfig)}`)

    // Add pipeline to core service
    const pipelineResponse = await request(CORE_URL)
      .post('/pipelines')
      .send(pipelineConfig)

    const pipelineId = pipelineResponse.body.id

    // Give the ODS time to process the pipeline
    await sleep(4000)

    // Check if data has been stored correctly
    const storageResponse = await request(STORAGE_URL)
      .get('/'+pipelineId)
    expect(storageResponse.status).toEqual(200)
    expect(storageResponse.type).toEqual('application/json')
    expect(storageResponse.body[0].data).toEqual(sourceData)

    // Check if webhook was triggered
    const webhookResponse = await request(MOCK_RECEIVER_URL)
      .get('/first')
    expect(webhookResponse.status).toEqual(200)
    expect(webhookResponse.type).toEqual('application/json')
    console.log(`Webhook response body ${JSON.stringify(webhookResponse.body)}`)
    expect(webhookResponse.body.location).toEqual(STORAGE_URL+'/'+pipelineId)
    expect(webhookResponse.body.timestamp).toBeDefined()
  }, 10000)
})

function generateConfig(sourceLocation, firstExecution, condition, notifyUrl) {
  return {
    "adapter": {
      "protocol": "HTTP",
      "format": "JSON",
      "location": sourceLocation
    },
    "transformations": [],
    "trigger": {
      "firstExecution": firstExecution,
      "periodic": false,
      "interval": 10000
    },
    "metadata": {
      "author": "Klaus Klausemeier",
      "license": "AGPL v30",
      "displayName": "test1",
      "description": "system test 1"
    },
    "notifications": [
      {
        "notificationType": "WEBHOOK",
        "condition": condition,
        "url": notifyUrl
      }
    ]
  }
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
