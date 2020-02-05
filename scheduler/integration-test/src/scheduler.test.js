/* eslint-env jest */
const request = require('supertest')
const waitOn = require('wait-on')

const URL = process.env.SCHEDULER_API || 'http://localhost:8080'

const MOCK_CORE_PORT = process.env.MOCK_CORE_PORT || 8081
const MOCK_CORE_HOST = process.env.MOCK_CORE_HOST || 'localhost'
const MOCK_CORE_URL = 'http://' + MOCK_CORE_HOST + ':' + MOCK_CORE_PORT

const MOCK_ADAPTER_PORT = process.env.MOCK_ADAPTER_PORT || 8082
const MOCK_ADAPTER_HOST = process.env.MOCK_ADAPTER_HOST || 'localhost'
const MOCK_ADAPTER_URL = 'http://' + MOCK_ADAPTER_HOST + ':' + MOCK_ADAPTER_PORT

const MOCK_TRANSFORMATION_PORT = process.env.MOCK_TRANSFORMATION_PORT || 8083
const MOCK_TRANSFORMATION_HOST = process.env.MOCK_TRANSFORMATION_HOST || 'localhost'
const MOCK_TRANSFORMATION_URL = 'http://' + MOCK_TRANSFORMATION_HOST + ':' + MOCK_TRANSFORMATION_PORT

const MOCK_STORAGE_PORT = process.env.MOCK_STORAGE_PORT || 8084
const MOCK_STORAGE_HOST = process.env.MOCK_STORAGE_HOST || 'localhost'
const MOCK_STORAGE_URL = 'http://' + MOCK_STORAGE_HOST + ':' + MOCK_STORAGE_PORT

const data = {
  field1: 'abc', // 'field' variables from adapter data
  field2: 123,
  field3: {
    name: 'simpleObject'
  },
  field4: [3, 5, 'a', 'z'],
  test: 'abc' // from transformation service
}

describe('Scheduler', () => {
  console.log('Scheduler-Service URL= ' + URL)

  beforeAll(async () => {
    const pingUrl = URL + '/'
    console.log('Waiting for service with URL: ' + MOCK_CORE_URL)
    console.log('Waiting for service with URL: ' + MOCK_ADAPTER_URL)
    console.log('Waiting for service with URL: ' + MOCK_TRANSFORMATION_URL)
    console.log('Waiting for service with URL: ' + MOCK_STORAGE_URL)
    await waitOn(
      { resources: [MOCK_CORE_URL, MOCK_ADAPTER_URL, MOCK_TRANSFORMATION_URL, MOCK_STORAGE_URL], timeout: 50000 })
    console.log('Waiting for service with URL: ' + pingUrl)
    await waitOn({ resources: [pingUrl], timeout: 50000 })
  }, 60000)

  test('GET /version', async () => {
    const response = await request(URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')
    const semanticVersionRegEx = '^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionRegEx))
  })

  test('GET /jobs', async () => {
    await sleep(2000) // wait until scheduler does sync
    const response = await request(URL).get('/jobs')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body.length).toEqual(2)
    expect(response.body[0].scheduleJob).toBeDefined() // TODO: make explicit
    expect(response.body[0].pipelineConfig.id).toEqual(123)
    expect(response.body[1].pipelineConfig.id).toEqual(125)
  })

  test('Pipeline runs with dummy data', async () => {
    await sleep(10000) // pipeline should have been exicuting until now!
    const response = await request(MOCK_STORAGE_URL).get('/125') // see what got stored
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body.data).toEqual(data)
  }, 12000)

  test('Pipeline triggers correct notifications', async () => {
    await sleep(10000) // pipeline should have been exicuting until now!
    const triggered = await request(MOCK_TRANSFORMATION_URL).get('/notification/webhook/nordstream')
    expect(triggered.status).toEqual(200)
    expect(triggered.body).toEqual(
      {
        pipelineId: 125,
        pipelineName: 'nordstream',
        type: 'WEBHOOK',
        data,
        dataLocation: MOCK_STORAGE_URL + '/125',
        condition: 'data.field2 < 0',
        url: 'should-also-be-triggered'
      })

    const alsoTriggered = await request(MOCK_TRANSFORMATION_URL).get('/notification/slack/nordstream')
    expect(alsoTriggered.status).toEqual(200)
    expect(alsoTriggered.type).toEqual('application/json')
    expect(alsoTriggered.body).toEqual(
      {
        pipelineId: 125,
        pipelineName: 'nordstream',
        type: 'SLACK',
        data,
        condition: 'data.field2 === 123',
        dataLocation: MOCK_STORAGE_URL + '/125',
        url: 'should-be-triggered'
      })
    const alsoTriggeredToo = await request(MOCK_TRANSFORMATION_URL).get('/notification/fcm/nordstream')
    expect(alsoTriggeredToo.status).toEqual(200)
    expect(alsoTriggeredToo.type).toEqual('application/json')
    expect(alsoTriggeredToo.body).toEqual(
      {
        pipelineId: 125,
        pipelineName: 'nordstream',
        type: 'FCM',
        data,
        condition: 'data.field2 === 123',
        dataLocation: MOCK_STORAGE_URL + '/125',
        url: 'should-be-triggered'
      })
    }, 12000)

  test('Pipeline processes events', async () => {
    await sleep(3000)
    const response = await request(URL).get('/jobs')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body).toHaveLength(2)
  })
})

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

afterAll(() => setTimeout(() => process.exit(), 1000))
