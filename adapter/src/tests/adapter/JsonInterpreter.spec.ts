import { Format } from '../../adapter/Format';

describe('doInterpret Json Format returns valid JSON', () => {
  test('doInterpret JSON data test', () => {
    const jsonFormat = Format.JSON;
    const data = JSON.stringify({
      uuid: '47174d8f-1b8e-4599-8a59-b580dd55bc87',
      number: '48900237',
      shortname: 'EITZE',
      longname: 'EITZE',
      km: 9.56,
      agency: 'VERDEN',
      longitude: 9.276769435375872,
      latitude: 52.90406544743417,
      water: { shortname: 'ALLER', longname: 'ALLER' },
    });
    return jsonFormat.doInterpret(data, {}).then((res) => {
      expect(JSON.stringify(res)).toBe(data);
    });
  });
});
