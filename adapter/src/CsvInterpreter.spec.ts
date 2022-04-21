import { Format } from './adapter/model/enum/Format';

describe('doInterpretCSVFormatReturnsValidJSON', () => {
  test('convert standard CSV to JSON', async () => {
    const csvFormat = Format.CSV;
    const data =
      'id,first_name,last_name,email,gender,ip_address\n' +
      '1,Ewell,Mathwin,emathwin0@hibu.com,Male,226.172.125.251\n' +
      '2,Fayth,Blampy,fblampy1@hubpages.com,Female,212.76.208.25\n' +
      '3,Kelli,Cornock,kcornock2@boston.com,Female,171.5.66.30\n';
    const parameters = {
      columnSeparator: ',',
      lineSeparator: '\n',
      skipFirstDataRow: false,
      firstRowAsHeader: true,
    };
    const expected = [
      {
        id: '1',
        first_name: 'Ewell',
        last_name: 'Mathwin',
        email: 'emathwin0@hibu.com',
        gender: 'Male',
        ip_address: '226.172.125.251',
      },
      {
        id: '2',
        first_name: 'Fayth',
        last_name: 'Blampy',
        email: 'fblampy1@hubpages.com',
        gender: 'Female',
        ip_address: '212.76.208.25',
      },
      {
        id: '3',
        first_name: 'Kelli',
        last_name: 'Cornock',
        email: 'kcornock2@boston.com',
        gender: 'Female',
        ip_address: '171.5.66.30',
      },
    ];
    const res = await csvFormat.doInterpret(data, parameters);
    expect(JSON.parse(res)).toEqual(expected);
  });
});
