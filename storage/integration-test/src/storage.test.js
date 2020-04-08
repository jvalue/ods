const request = require('supertest')
const waitOn = require('wait-on')

const URL = process.env.STORAGE_API || 'http://localhost:9000/storage'

describe('Storage', () => {
  console.log('Storage-Service URL= ' + URL)

  beforeAll(async () => {
    try {
      const pingUrl = URL
      console.log('Waiting for service with URL: ' + pingUrl)
      await waitOn({ resources: [pingUrl], timeout: 50000 })
      console.log('[online] Service with URL:  ' + pingUrl)
    } catch (err) {
      process.exit(1)
    }
  }, 60000)

  test('POST /rpc/createStructureForDatasource', async () => {
    const reqBody = {
      pipelineid: 'pipeline-123test'
    }

    const response = await request(URL)
      .post('/rpc/createstructurefordatasource')
      .send(reqBody)
    expect(response.status).toEqual(200)
  })

  test('POST /pipeline-123test', async () => {
    const reqBody = {
      data: {
        argument1: 'string',
        argument2: 123
      }
    }

    const response = await request(URL)
      .post('/pipeline-123test')
      .send(reqBody)
    expect(response.status).toEqual(201)
  })

  test('GET /pipeline-123test', async () => {
    const response = await request(URL)
      .get('/pipeline-123test')
    expect(response.status).toEqual(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0].id).toBeDefined()
    expect(response.body[0].data).toEqual({ argument1: 'string', argument2: 123 })
  })

  test('POST /rpc/deleteStructureForDatasource', async () => {
    const reqBody = {
      pipelineid: 'pipeline-123test'
    }

    const response = await request(URL)
      .post('/rpc/deletestructurefordatasource')
      .send(reqBody)
    expect(response.status).toEqual(200)
  })
})
