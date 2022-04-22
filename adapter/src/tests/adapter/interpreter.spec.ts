import { AdapterEndpoint } from '../../adapter/api/rest/adapterEndpoint';
import { Format } from '../../adapter/model/enum/Format';
import { Protocol } from '../../adapter/model/enum/Protocol';

/* eslint-env jest */
describe('getFormat should return correct Result', () => {
  test('getFormat test throws exception for not existing format', () => {
    expect(() => {
      AdapterEndpoint.getFormat('not here');
    }).toThrow(Error);
  });
  
});

d
});
