import { AdapterEndpoint } from './adapter/api/rest/adapterEndpoint';
import { Format } from './adapter/model/enum/Format';
import { Protocol } from './adapter/model/enum/Protocol';

/* eslint-env jest */
describe('getFormatShouldReturnErrorWhenNotFound', () => {
  test('getFormat test', () => {
    expect(() => {
      AdapterEndpoint.getFormat('not here');
    }).toThrow(Error);
  });
});

describe('getFormatShouldReturnCSV', () => {
  test('getFormat test', () => {
    const result = AdapterEndpoint.getFormat('CSV');
    expect(result).toBe(Format.CSV);
  });
});

describe('getFormatShouldReturnXML', () => {
  test('getFormat test', () => {
    const result = AdapterEndpoint.getFormat('XML');
    expect(result).toBe(Format.XML);
  });
});

describe('getFormatShouldReturnJSON', () => {
  test('getFormat test', () => {
    const result = AdapterEndpoint.getFormat('JSON');
    expect(result).toBe(Format.JSON);
  });
});

describe('getProtocolShouldReturnHTTP', () => {
  test('getProtocol test', () => {
    const result = AdapterEndpoint.getProtocol('HTTP');
    expect(result).toBe(Protocol.HTTP);
  });
});

describe('getProtocolShouldReturnError', () => {
  test('getProtocol test', () => {
    expect(() => {
      AdapterEndpoint.getProtocol('not here');
    }).toThrow(Error);
  });
});
