import SchemaParser from '../service/schemaparser'
import * as testData from './testDataHelper'

describe('schema generation', () => {
  test('return valid jsonschema for Pegel based on the ontology schema', () => {
    const schemaParser = new SchemaParser()
    const response = schemaParser.parse(testData.JSONSchemaOrdngungsamtComplete, 'TESTSCHEMA', 'TESTTABLE')
    console.log(response)
    expect(response).toEqual(testData.JSONSchemaPegelComplete)
  })
})
