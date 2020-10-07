/* eslint-env jest */
const request = require('supertest')
const waitOn = require('wait-on')

const {
  SCHEDULER_URL,
  AMQP_URL
} = require('./env')

describe('Scheduler', () => {
  console.log('Scheduler-Service URL= ' + URL)

  beforeAll(async () => {
    const pingUrl = SCHEDULER_URL + '/'
    await waitOn(
      { resources: [pingUrl], timeout: 50000, log: true })
  }, 60000)

  test('GET /version', async () => {
    const response = await request(SCHEDULER_URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')
    const semanticVersionRegEx = '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionRegEx))
  })

  test('GET /jobs', async () => {
    await sleep(4000) // wait until scheduler does sync
    const response = await request(SCHEDULER_URL).get('/jobs')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body).toHaveLength(2)
    expect(response.body[0].scheduleJob).toBeDefined() // TODO: make explicit
    expect(response.body[0].datasourceConfig.id).toEqual(1)
    expect(response.body[1].datasourceConfig.id).toEqual(2)
  })

  test('Pipeline processes events', async () => {
    await sleep(3000)
    const response = await request(SCHEDULER_URL).get('/jobs')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body).toHaveLength(2)
  })
})

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

afterAll(() => setTimeout(() => process.exit(), 1000))
