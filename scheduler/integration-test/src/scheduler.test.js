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

const MOCK_NOTIFICATION_PORT = process.env.MOCK_NOTIFICATION_PORT || 8084
const MOCK_NOTIFICATION_HOST = process.env.MOCK_NOTIFICATION_HOST || 'localhost'
const MOCK_NOTIFICATION_URL = 'http://' + MOCK_NOTIFICATION_HOST + ':' + MOCK_NOTIFICATION_PORT

const MOCK_STORAGE_PORT = process.env.MOCK_STORAGE_PORT || 8085
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
    console.log('Waiting for service with URL: ' + MOCK_NOTIFICATION_URL)
    console.log('Waiting for service with URL: ' + MOCK_STORAGE_URL)
    await waitOn(
      { resources: [MOCK_CORE_URL, MOCK_ADAPTER_URL, MOCK_TRANSFORMATION_URL, MOCK_NOTIFICATION_URL, MOCK_STORAGE_URL], timeout: 50000 })
    console.log('Waiting for service with URL: ' + pingUrl)
    await waitOn({ resources: [pingUrl], timeout: 50000 })
  }, 60000)

  test('GET /version', async () => {
    const response = await request(URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')
    const semanticVersionRegEx = '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionRegEx))
  })

  test('GET /jobs', async () => {
    await sleep(4000) // wait until scheduler does sync
    const response = await request(URL).get('/jobs')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body).toHaveLength(2)
    expect(response.body[0].scheduleJob).toBeDefined() // TODO: make explicit
    expect(response.body[0].datasourceConfig.id).toEqual(1)
    expect(response.body[1].datasourceConfig.id).toEqual(2)
  })

  test('Pipeline runs with dummy data', async () => {
    await sleep(10000) // pipeline should have been executing until now!
    const response = await request(MOCK_STORAGE_URL).get('/125') // see what got stored
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body.data).toEqual(data)
  }, 12000)

  test('Pipeline triggers correct notifications', async () => {
    await sleep(10000) // pipeline should have been executing until now!
    const triggered = await request(MOCK_NOTIFICATION_URL).get(`/trigger/125`)
    expect(triggered.status).toEqual(200)
    expect(triggered.body).toEqual(
      {
        pipelineId: 125,
        pipelineName: 'nordstream',
        data,
        dataLocation: MOCK_STORAGE_URL + '/125',
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
