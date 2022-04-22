import { Importer } from '../../adapter/importer/Importer';
import { ImporterParameterDescription } from '../../adapter/importer/ImporterParameterDescription';
import { Protocol } from '../../adapter/model/enum/Protocol';

/* eslint-env jest */
describe('getAvaialbleParameters Tests', () => {
  test('getFormat test throws exception for not existing format', () => {
    const importer: Importer = Protocol.HTTP;
    const availableParameters: ImporterParameterDescription[] =
      importer.getAvailableParameters();
    expect(availableParameters[0].type).toBe('string');
    expect(availableParameters[1].type).toBe('string');
  });

  test('getAvailableParameters is of Type ImporterParameterDescription', () => {
    const importer: Importer = Protocol.HTTP;
    const availableParameters = importer.getAvailableParameters();
    expect(availableParameters).toBeInstanceOf(Array);
  });
});

describe('validateParameters HTTP Importer Tests', () => {
  test('validateParameters HTTP Importer with UTF-8 works', () => {
    const importer: Importer = Protocol.HTTP;
    const parameters = {
      location:
        'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json',
      encoding: 'UTF-8',
    };
    importer.validateParameters(parameters);
  });

  test('validateParameters HTTP Importer with US-ASCII works', () => {
    const importer: Importer = Protocol.HTTP;
    const parameters = {
      location:
        'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json',
      encoding: 'US-ASCII',
    };
    importer.validateParameters(parameters);
  });

  test('validateParameters HTTP Importer with ISO-8859-1 works', () => {
    const importer: Importer = Protocol.HTTP;
    const parameters = {
      location:
        'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json',
      encoding: 'ISO-8859-1',
    };
    importer.validateParameters(parameters);
  });

  test('validateParameters HTTP Importer with a wrong Encoding does not work', () => {
    const importer: Importer = Protocol.HTTP;
    const parameters = {
      location:
        'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json',
      encoding: 'encodingwrong',
    };
    expect(() => {
      importer.validateParameters(parameters);
    }).toThrow(Error);
  });
});
