import JsonSchemaParser from '../service/jsonSchemaParser';
import PostgresParser from '../service/postgresParser';

// Import SchemaToObjectParser from '../service/schematoobjectparser'
import * as testData from './testDataHelper';

describe('schema generation', () => {
  test('return valid jsonschema for Pegel based on the ontology schema', async () => {
    const jsonSchemaParser: PostgresParser = new JsonSchemaParser();
    const response = await jsonSchemaParser.parseCreateStatement(
      testData.JSONSchemaPegelComplete,
      'TESTSCHEMA',
      'TESTTABLE',
    );
    expect(response[0]).toEqual(testData.PostgresSchemaPegelCreate[0]);
  });
});

// TODO additional tests
/* Describe('schema generation', () => {
  test('return valid jsonschema for Pegel based on the ontology schema', async () => {
    const schemaParser = new SchemaParser()
    const response =
      await schemaParser.parse(
        testData.JSONSchemaPegelComplete,
        testData.MultiCompletePegel,
        'TESTSCHEMA',
        'TESTTABLE',
        0
      )
    expect(response).toEqual(testData.PostgresSchemaMultiPegelInsert)
  })
})

/* describe('schema generation', () => {
  test('return valid jsonschema for Pegel based on the ontology schema', async () => {
    const schemaParser = new SchemaParser()
    const response =
      await schemaParser.parse(
        testData.JSONSchemaOrdngungsamtComplete,
        testData.MultiCompleteOrdnungsamt,
        'TESTSCHEMA',
        'TESTTABLE',
        0
      )
    console.log(response)
    expect(response).toEqual(testData.PostgresSchemaMultiPegelInsert)
  })
})

/* describe('schema generation', () => {
  test('return valid jsonschema for Pegel based on the ontology schema', async () => {
    const schemaToObjectParser = new SchemaToObjectParser()
    const response =
      await schemaToObjectParser.parse(testData.JSONSchemaOrdngungsamtComplete)
    console.log(response)
    expect(response).toEqual(testData.PostgresSchemaPegelComplete)
  })
})
*/
