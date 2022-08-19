import { Protocol } from '../../importer';
import { Format } from '../../interpreter';

import { AdapterEndpoint } from './adapterEndpoint';

/* eslint-env jest */
describe('getFormat should return correct Result', () => {
  test('getFormat test throws exception for not existing format', () => {
    expect(() => {
      AdapterEndpoint.getFormat('not here');
    }).toThrow(Error);
  });
  test('getFormat test for CSV', () => {
    const result = AdapterEndpoint.getFormat('CSV');
    expect(result).toBe(Format.CSV);
  });
  test('getFormat test for XML', () => {
    const result = AdapterEndpoint.getFormat('XML');
    expect(result).toBe(Format.XML);
  });
  test('getFormat test for JSON', () => {
    const result = AdapterEndpoint.getFormat('JSON');
    expect(result).toBe(Format.JSON);
  });
});

describe('getProtocol should return correct Result', () => {
  test('getProtocol test for HTTP', () => {
    const result = AdapterEndpoint.getProtocol('HTTP');
    expect(result).toBe(Protocol.HTTP);
  });
  test('getProtocol test throws exception for not existing Protocol', () => {
    expect(() => {
      AdapterEndpoint.getProtocol('not here');
    }).toThrow(Error);
  });
});
