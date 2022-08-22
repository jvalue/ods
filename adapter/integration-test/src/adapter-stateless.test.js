const request = require('supertest')

const { ADAPTER_URL, MOCK_SERVER_URL_WITHIN_DOCKER } = require('./util/env')

const TIMEOUT = 10000

describe('Stateless data import', () => {
  test(
    'Should respond with semantic version [GET /version]',
    async () => {
      const response = await request(ADAPTER_URL).get('/version')
      expect(response.status).toEqual(200)
      expect(response.type).toEqual('text/plain')

      const semanticVersionRegEx =
        '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)'
      expect(response.text).toMatch(new RegExp(semanticVersionRegEx))
    },
    TIMEOUT
  )

  test(
    'Should respond with all available formats [GET /formats]',
    async () => {
      const response = await request(ADAPTER_URL).get('/formats')
      expect(response.status).toEqual(200)
      expect(response.type).toEqual('application/json')
      expect(response.body.length).toBeGreaterThanOrEqual(2)

      console.log(JSON.stringify(response.body))
      response.body.forEach((e) => {
        expect(e.type).toBeDefined()
        expect(e.parameters).toBeDefined()
      })
    },
    TIMEOUT
  )

  test(
    'Should respond with all available protocols [GET /protocols]',
    async () => {
      const response = await request(ADAPTER_URL).get('/protocols')
      expect(response.status).toEqual(200)
      expect(response.type).toEqual('application/json')
      expect(response.body.length).toBeGreaterThanOrEqual(1)

      response.body.forEach((e) => {
        expect(e.type).toBeDefined()
        expect(e.parameters).toBeDefined()
      })
    },
    TIMEOUT
  )

  test(
    'Should import json data',
    async () => {
      const reqBody = {
        protocol: {
          type: 'HTTP',
          parameters: {
            location: MOCK_SERVER_URL_WITHIN_DOCKER + '/json',
            encoding: 'UTF-8'
          }
        },
        format: {
          type: 'JSON',
          parameters: {}
        }
      }

      const response = await request(ADAPTER_URL)
        .post('/preview')
        .send(reqBody)
      expect(response.status).toEqual(200)
      const importedData = response.body.data
      expect(JSON.parse(importedData)).toEqual({
        whateverwillbe: 'willbe',
        quesera: 'sera'
      })
    },
    TIMEOUT
  )

  test(
    'Should import raw xml data',
    async () => {
      const reqBody = {
        type: 'HTTP',
        parameters: {
          location: MOCK_SERVER_URL_WITHIN_DOCKER + '/xml',
          encoding: 'UTF-8'
        }
      }

      const response = await request(ADAPTER_URL)
        .post('/preview/raw')
        .send(reqBody)

      expect(response.status).toEqual(200)
      expect(response.body.data).toEqual(
        '<?xml version="1.0" encoding="UTF-8"?>' +
          '<root><from>Rick</from><to>Morty</to></root>'
      )
    },
    TIMEOUT
  )

  test(
    'Should import and format xml data',
    async () => {
      const reqBody = {
        protocol: {
          type: 'HTTP',
          parameters: {
            location: MOCK_SERVER_URL_WITHIN_DOCKER + '/xml',
            encoding: 'UTF-8'
          }
        },
        format: {
          type: 'XML',
          parameters: {}
        }
      }

      const response = await request(ADAPTER_URL)
        .post('/preview')
        .send(reqBody)
      expect(response.status).toEqual(200)
      const importedData = response.body.data
      expect(JSON.parse(importedData)).toEqual({
        root: { from: 'Rick', to: 'Morty' }
      })
    },
    TIMEOUT
  )

  test(
    'Should import and format more xml data',
    async () => {
      const reqBody = {
        protocol: {
          type: 'HTTP',
          parameters: {
            location: MOCK_SERVER_URL_WITHIN_DOCKER + '/xmlbigger',
            encoding: 'UTF-8'
          }
        },
        format: {
          type: 'XML',
          parameters: {}
        }
      }

      const response = await request(ADAPTER_URL)
        .post('/preview')
        .send(reqBody)
      expect(response.status).toEqual(200)
      const importedData = response.body.data
      expect(JSON.parse(importedData)).toEqual({
        root: {
          from: 'Rick',
          to: 'Morty',
          test: { hello: 'hello', servus: 'servus' }
        }
      })
    },
    TIMEOUT
  )

  test(
    'Should import and format csv data',
    async () => {
      const reqBody = {
        protocol: {
          type: 'HTTP',
          parameters: {
            location: MOCK_SERVER_URL_WITHIN_DOCKER + '/csv',
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
        .post('/preview')
        .send(reqBody)
      expect(response.status).toEqual(200)
      const importedData = response.body.data
      const expected = [
        {
          col1: 'val11',
          col2: 'val12',
          col3: 'val13'
        },
        {
          col1: 'val21',
          col2: 'val22',
          col3: 'val23'
        }
      ]

      expect(JSON.parse(importedData)).toEqual(expected)
    },
    TIMEOUT
  )

  test(
    'Should return 400 BAD_REQUEST for unsupported protocol [POST /preview]',
    async () => {
      const reqBody = {
        protocol: {
          type: 'UNSUPPORTED',
          parameters: {
            location: MOCK_SERVER_URL_WITHIN_DOCKER + '/json',
            encoding: 'UTF-8'
          }
        },
        format: {
          type: 'JSON',
          parameters: {}
        }
      }
      const response = await request(ADAPTER_URL)
        .post('/preview')
        .send(reqBody)
      expect(response.status).toEqual(400)
    },
    TIMEOUT
  )

  test(
    'Should return 400 BAD_REQUEST for unsupported format [POST /preview]',
    async () => {
      const reqBody = {
        protocol: {
          type: 'HTTP',
          parameters: {
            location: MOCK_SERVER_URL_WITHIN_DOCKER + '/json',
            encoding: 'UTF-8'
          }
        },
        format: {
          type: 'UNSUPPORTED',
          parameters: {}
        }
      }
      const response = await request(ADAPTER_URL)
        .post('/preview')
        .send(reqBody)
      expect(response.status).toEqual(400)
    },
    TIMEOUT
  )

  test(
    'Should return 400 BAD_REQUEST for invalid location [POST /preview]',
    async () => {
      const reqBody = {
        protocol: {
          type: 'HTTP',
          parameters: {
            location: 'invalid-location',
            encoding: 'UTF-8'
          }
        },
        format: {
          type: 'JSON',
          parameters: {}
        }
      }
      const response = await request(ADAPTER_URL)
        .post('/preview')
        .send(reqBody)
      expect(response.status).toEqual(400)
    },
    TIMEOUT
  )

  test(
    'Should return 500 INTERNAL_SERVER_ERROR for data not found [POST /preview]',
    async () => {
      const reqBody = {
        protocol: {
          type: 'HTTP',
          parameters: {
            location: MOCK_SERVER_URL_WITHIN_DOCKER + '/not-found',
            encoding: 'UTF-8'
          }
        },
        format: {
          type: 'JSON',
          parameters: {}
        }
      }
      const response = await request(ADAPTER_URL)
        .post('/preview')
        .send(reqBody)
      expect(response.status).toEqual(500)
    },
    TIMEOUT
  )
})
