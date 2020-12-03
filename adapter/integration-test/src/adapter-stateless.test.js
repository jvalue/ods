const request = require('supertest')

const {
  ADAPTER_URL,
  MOCK_SERVER_URL
} = require('./env')
const { waitForServicesToBeReady } = require('./waitForServices')

const TIMEOUT = 10000

describe('Stateless data import', () => {
  beforeAll(async () => {
    await waitForServicesToBeReady()
  }, 60000)

  test('Should respond with semantic version [GET /version]', async () => {
    const response = await request(ADAPTER_URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')

    const semanticVersionRegEx = '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionRegEx))
  }, TIMEOUT)

  test('Should respond with all available formats [GET /formats]', async () => {
    const response = await request(ADAPTER_URL).get('/formats')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body.length).toBeGreaterThanOrEqual(2)

    response.body.forEach(e => {
      expect(e.type).toBeDefined()
      expect(e.parameters).toBeDefined()
    })
  }, TIMEOUT)

  test('Should respond with all available protocols [GET /protocols]', async () => {
    const response = await request(ADAPTER_URL).get('/protocols')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body.length).toBeGreaterThanOrEqual(1)

    response.body.forEach(e => {
      expect(e.type).toBeDefined()
      expect(e.parameters).toBeDefined()
    })
  }, TIMEOUT)

  test('Should create a JSON adapter as importer [POST /dataImport]', async () => {
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

  test('Should handle includeData parameter appropriately when requesting a dataImport', async () => {
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
      .query('includeData=true')
      .send(reqBody)

    expect(response.status).toEqual(200)
    expect(response.body.id).toBeGreaterThan(0)
    expect(JSON.parse(response.body.data)).toEqual({ whateverwillbe: 'willbe', quesera: 'sera' })
  }, TIMEOUT)

  test('Should execute data preview [POST /preview]', async () => {
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
      .post('/preview')
      .query('includeData=true')
      .send(reqBody)

    expect(response.status).toEqual(200)
    expect(response.body.id).toBeGreaterThan(0)
    expect(JSON.parse(response.body.data)).toEqual({ whateverwillbe: 'willbe', quesera: 'sera' })
  }, TIMEOUT)

  test('Should execute raw preview [POST /preview/raw', async () => {
    const reqBody = {
      type: 'HTTP',
      parameters: {
        location: MOCK_SERVER_URL + '/xml',
        encoding: 'UTF-8'
      }
    }

    const response = await request(ADAPTER_URL)
      .post('/preview/raw')
      .query('includeData=true')
      .send(reqBody)

    expect(response.status).toEqual(200)
    expect(response.body.id).toBeNull()
    expect(response.body.data).toEqual(
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<root><from>Rick</from><to>Morty</to></root>'
    )
  }, TIMEOUT)

  test('Should create a XML adapter as importer [POST /dataImport]', async () => {
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

  test('Should create a CSV adapter as importer [POST /dataImport]', async () => {
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

  test('Should return 400 BAD_REQUEST for unsupported protocol [POST /dataImport]', async () => {
    const reqBody = {
      protocol: {
        type: 'UNSUPPORTED',
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
    expect(response.status).toEqual(400)
  }, TIMEOUT)

  test('Should return 400 BAD_REQUEST for unsupported format [POST /dataImport]', async () => {
    const reqBody = {
      protocol: {
        type: 'HTTP',
        parameters: {
          location: MOCK_SERVER_URL + '/json',
          encoding: 'UTF-8'
        }
      },
      format: {
        type: 'UNSUPPORTED'
      }
    }
    const response = await request(ADAPTER_URL)
      .post('/dataImport')
      .send(reqBody)
    expect(response.status).toEqual(400)
  }, TIMEOUT)

  test('Should return 400 BAD_REQUEST for invalid location [POST /dataImport]', async () => {
    const reqBody = {
      protocol: {
        type: 'HTTP',
        parameters: {
          location: 'invalid-location',
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
    expect(response.status).toEqual(400)
  }, TIMEOUT)

  test('Should return 400 BAD_REQUEST for data not found [POST /dataImport]', async () => {
    const reqBody = {
      protocol: {
        type: 'HTTP',
        parameters: {
          location: MOCK_SERVER_URL + '/not-found',
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
    expect(response.status).toEqual(400)
  }, TIMEOUT)
})
