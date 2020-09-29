const request = require('supertest')

const {
  ADAPTER_URL,
  MOCK_SERVER_URL
} = require('./env')
const { waitForServicesToBeReady } = require('./waitForServices')

const TIMEOUT = 10000

describe('Adapter Stateless', () => {
  beforeAll(async () => {
    await waitForServicesToBeReady()
  }, 60000)

  test('GET /version', async () => {
    const response = await request(ADAPTER_URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')

    const semanticVersionRegEx = '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionRegEx))
  }, TIMEOUT)

  test('GET /formats', async () => {
    const response = await request(ADAPTER_URL).get('/formats')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body.length).toBeGreaterThanOrEqual(2)

    response.body.forEach(e => {
      expect(e.type).toBeDefined()
      expect(e.parameters).toBeDefined()
    })
  }, TIMEOUT)

  test('GET /protocols', async () => {
    const response = await request(ADAPTER_URL).get('/protocols')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body.length).toBeGreaterThanOrEqual(1)

    response.body.forEach(e => {
      expect(e.type).toBeDefined()
      expect(e.parameters).toBeDefined()
    })
  }, TIMEOUT)

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
    const response = await request(ADAPTER_URL)
      .post('/dataImport')
      .send(reqBody)
    expect(response.status).toEqual(200)
    const dataBlobId = response.body.id

    const dataResponse = await request(ADAPTER_URL)
      .get(`/data/${dataBlobId}`)
      .send()
    expect(dataResponse.status).toEqual(200)
    expect(dataResponse.body).toEqual({ whateverwillbe: 'willbe', quesera: 'sera' })
  }, TIMEOUT)

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

    const response = await request(ADAPTER_URL)
      .post('/dataImport')
      .send(reqBody)
    expect(response.status).toEqual(200)

    const dataBlobId = response.body.id
    const dataResponse = await request(ADAPTER_URL)
      .get(`/data/${dataBlobId}`)
      .send()

    expect(dataResponse.status).toEqual(200)
    expect(dataResponse.body).toEqual({ from: 'Rick', to: 'Morty' })
  }, TIMEOUT)

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
    const response = await request(ADAPTER_URL)
      .post('/dataImport')
      .send(reqBody)
    expect(response.status).toEqual(200)

    const dataBlobId = response.body.id
    const dataResponse = await request(ADAPTER_URL)
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
  }, TIMEOUT)
})
