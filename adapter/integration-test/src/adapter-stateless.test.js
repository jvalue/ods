const request = require('supertest')
const waitOn = require('wait-on')

const URL = process.env.ADAPTER_API || 'http://localhost:9000/api/adapter'
const MOCK_SERVER_PORT = process.env.MOCK_SERVER_PORT || 8081
const MOCK_SERVER_HOST = process.env.MOCK_SERVER_HOST || 'localhost'
const MOCK_SERVER_URL = 'http://' + MOCK_SERVER_HOST + ':' + MOCK_SERVER_PORT
const RABBIT_URL = `http://${process.env.RABBIT_HOST}:15672`

describe('Adapter Stateless', () => {
  beforeAll(async () => {
    try {
      const pingUrl = URL + '/version'
      console.log('Starting adapter stateless test')
      await waitOn({ resources: [MOCK_SERVER_URL, RABBIT_URL, pingUrl], timeout: 50000, log: true })
      console.log('Wait on complete')
    } catch (err) {
      process.exit(1)
    }
  }, 60000)

  test('GET /version', async () => {
    const response = await request(URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')

    const semanticVersionRegEx = '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionRegEx))
  })

  test('GET /formats', async () => {
    const response = await request(URL).get('/formats')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body.length).toBeGreaterThanOrEqual(2)

    response.body.forEach(e => {
      expect(e.type).toBeDefined()
      expect(e.parameters).toBeDefined()
    })
  })

  test('GET /protocols', async () => {
    const response = await request(URL).get('/protocols')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body.length).toBeGreaterThanOrEqual(1)

    response.body.forEach(e => {
      expect(e.type).toBeDefined()
      expect(e.parameters).toBeDefined()
    })
  })

  test('POST /dataImport JSON-Adapter', async () => {
    const reqBody = {
      protocol: {
        type: 'HTTP',
        parameters: {
          location: MOCK_SERVER_URL + '/json',
          encoding: 'UTF-8'
        }
      },
      format: {
        type: 'JSON'
      }
    }
    const response = await request(URL)
      .post('/dataImport')
      .send(reqBody)
    expect(response.status).toEqual(200)
    const dataBlobId = response.body.id

    const dataResponse = await request(URL)
      .get(`/data/${dataBlobId}`)
      .send()
    expect(dataResponse.status).toEqual(200)
    expect(dataResponse.body).toEqual({ whateverwillbe: 'willbe', quesera: 'sera' })
  })

  test('POST /dataImport XML-Adapter', async () => {
    const reqBody = {
      protocol: {
        type: 'HTTP',
        parameters: {
          location: MOCK_SERVER_URL + '/xml',
          encoding: 'UTF-8'
        }
      },
      format: {
        type: 'XML'
      }
    }

    const response = await request(URL)
      .post('/dataImport')
      .send(reqBody)
    expect(response.status).toEqual(200)

    const dataBlobId = response.body.id
    const dataResponse = await request(URL)
      .get(`/data/${dataBlobId}`)
      .send()

    expect(dataResponse.status).toEqual(200)
    expect(dataResponse.body).toEqual({ from: 'Rick', to: 'Morty' })
  })

  test('POST /dataImport CSV-Adapter', async () => {
    const reqBody = {
      protocol: {
        type: 'HTTP',
        parameters: {
          location: MOCK_SERVER_URL + '/csv',
          encoding: 'UTF-8'
        }
      },
      format: {
        type: 'CSV',
        parameters: {
          columnSeparator: ',',
          lineSeparator: '\n',
          skipFirstDataRow: false,
          firstRowAsHeader: true
        }
      }
    }
    const response = await request(URL)
      .post('/dataImport')
      .send(reqBody)
    expect(response.status).toEqual(200)

    const dataBlobId = response.body.id
    const dataResponse = await request(URL)
      .get(`/data/${dataBlobId}`)
      .send()
    expect(dataResponse.status).toEqual(200)
    expect(dataResponse.body).toEqual([
      {
        col1: 'val11',
        col2: 'val12',
        col3: 'val13'
      }, {
        col1: 'val21',
        col2: 'val22',
        col3: 'val23'
      }
    ])
  })
})
