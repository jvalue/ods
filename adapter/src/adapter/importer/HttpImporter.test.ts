import { ImporterParameterError } from '../exceptions/ImporterParameterError';

import { Importer, ImporterParameterDescription } from './Importer';

import { Protocol } from '.';

/* eslint-env jest */
describe('getAvaialbleParameters Tests', () => {
  test('getAvaiableParameters are of type string', () => {
    const importer: Importer = Protocol.HTTP;
    const availableParameters: ImporterParameterDescription[] =
      importer.getAvailableParameters();
    expect(availableParameters[0].type).toBe('string');
    expect(availableParameters[1].type).toBe('string');
  });

  test('getAvailableParameters is of Type Array', () => {
    const importer: Importer = Protocol.HTTP;
    const availableParameters = importer.getAvailableParameters();
    expect(availableParameters).toBeInstanceOf(Array);
  });
});

describe('validateParameters from Abstract Parent Class Tests', () => {
  test('validateParameters with valid Parameters works', () => {
    const importer: Importer = Protocol.HTTP;
    const parameters = {
      location:
        'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json',
      encoding: 'UTF-8',
    };
    importer.validateParameters(parameters);
  });

  test('validateParameters finds unavailable Parameter', () => {
    const importer: Importer = Protocol.HTTP;
    const wrongParameters = {
      location:
        'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json',
      encoding: 'UTF-8',
      parameter3: 'komischer parameter',
    };
    expect(() => {
      importer.validateParameters(wrongParameters);
    }).toThrow(ImporterParameterError);
  });

  test('validateParameters is missing encoding Parameter', () => {
    const importer: Importer = Protocol.HTTP;
    const wrongParameters = {
      location:
        'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json',
    };
    expect(() => {
      importer.validateParameters(wrongParameters);
    }).toThrow(ImporterParameterError);
  });

  test('validateParameters is missing location Parameter', () => {
    const importer: Importer = Protocol.HTTP;
    const wrongParameters = {
      encoding: 'UTF-8',
    };
    expect(() => {
      importer.validateParameters(wrongParameters);
    }).toThrow(ImporterParameterError);
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
