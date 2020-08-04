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

const RABBIT_HEALTH_URL = process.env.RABBIT_HEALTH_URL

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
    console.log('Waiting for rabbitMQ with URL: ' + RABBIT_HEALTH_URL)
    await waitOn(
      { resources: [MOCK_CORE_URL, MOCK_ADAPTER_URL, MOCK_TRANSFORMATION_URL], timeout: 50000 })
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

  test('Pipeline runs through with successful publish', async () => {
    await sleep(10000) // pipeline should have been executing until now!
    let response = await request(MOCK_TRANSFORMATION_URL).get(`/config/triggers/125`)
    expect(response.status).toEqual(200)
    expect(response.body).toContainEqual(
      {
        pipelineId: 125,
        pipelineName: 'nordstream',
        dataLocation: "http://scheduler-it:8082/data/1",
        func: "return 1;"
      })

    response = await request(MOCK_TRANSFORMATION_URL).get(`/config/triggers/123`)
    expect(response.status).toEqual(200)
    expect(response.body).toContainEqual(
      {
        pipelineId: 123,
        dataLocation: "http://scheduler-it:8082/data/1",
        func: "return data;"
      }
    )
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
