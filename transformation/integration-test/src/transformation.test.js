/* eslint-env jest */
const request = require('supertest')
const waitOn = require('wait-on')

const URL = process.env.TRANSFORMATION_API || 'http://localhost:9000/transformation'

describe('Scheduler', () => {
  console.log('Scheduler-Service URL= ' + URL)

  beforeAll(async () => {
    const pingUrl = URL + '/'
    console.log('Waiting for service with URL: ' + pingUrl)
    await waitOn({ resources: [pingUrl], timeout: 50000 })
  }, 60000)

  test('GET /version', async () => {
    const response = await request(URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')
    expect(response.text).toMatch(new RegExp('^(0|[1-9]d*).(0|[1-9]d*).(0|[1-9]d*)'))
    // for semantic version
  })

  test('POST /job numerical', async () => {
    const simpleJob = {
      func: 'return 1;',
      data: {}
    }

    const response = await request(URL)
      .post('/job')
      .send(simpleJob)

    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body).toEqual(1)
  })

  test('POST /job', async () => {
    const simpleJob = {
      func: 'return {number: 1};',
      data: {}
    }

    const response = await request(URL)
      .post('/job')
      .send(simpleJob)

    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body).toEqual({ number: 1 })
  })

  test('POST /job with transformation', async () => {
    const transformationJob = {
      func: 'return {numberTwo: data.number+1};',
      data: { number: 1 }
    }

    const response = await request(URL)
      .post('/job')
      .send(transformationJob)

    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body).toEqual({ numberTwo: 2 })
  })
})

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
