import { Format } from '../../adapter/model/enum/Format';

describe('doInterpret CSV Format returns valid JSON', () => {
  test('convert standard CSV to JSON with lineSeperator \n and Column Seperator ,', async () => {
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

  test('convert standard CSV to JSON with lineSeperator \r and ColumnSeperator ;', async () => {
    const csvFormat = Format.CSV;
    const data =
      'id;first_name;last_name;email;gender;ip_address\r' +
      '1;Ewell;Mathwin;emathwin0@hibu.com;Male;226.172.125.251\r' +
      '2;Fayth;Blampy;fblampy1@hubpages.com;Female;212.76.208.25\r' +
      '3;Kelli;Cornock;kcornock2@boston.com;Female;171.5.66.30\r';
    const parameters = {
      columnSeparator: ';',
      lineSeparator: '\r',
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

describe('doInterpret CSV Format with SkipFirstRow = TRUE returns valid JSON with missing first Row', () => {
  test('convert standard CSV to JSON with skipFirstRow', async () => {
    const csvFormat = Format.CSV;
    const data =
      'id,first_name,last_name,email,gender,ip_address\n' +
      '1,Ewell,Mathwin,emathwin0@hibu.com,Male,226.172.125.251\n' +
      '2,Fayth,Blampy,fblampy1@hubpages.com,Female,212.76.208.25\n' +
      '3,Kelli,Cornock,kcornock2@boston.com,Female,171.5.66.30\n';
    const parameters = {
      columnSeparator: ',',
      lineSeparator: '\n',
      skipFirstDataRow: true,
      firstRowAsHeader: true,
    };
    const expected = [
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

describe('doInterpret CSV Format with FirstRowAsHeader = FALSE returns valid JSON', () => {
  test('convert standard CSV to JSON with skipFirstRow', async () => {
    const csvFormat = Format.CSV;
    const data =
      '1,Ewell,Mathwin,emathwin0@hibu.com,Male,226.172.125.251\n' +
      '2,Fayth,Blampy,fblampy1@hubpages.com,Female,212.76.208.25\n' +
      '3,Kelli,Cornock,kcornock2@boston.com\n';
    const parameters = {
      columnSeparator: ',',
      lineSeparator: '\n',
      skipFirstDataRow: false,
      firstRowAsHeader: false,
    };
    const expected = [
      {
        field1: '1',
        field2: 'Ewell',
        field3: 'Mathwin',
        field4: 'emathwin0@hibu.com',
        field5: 'Male',
        field6: '226.172.125.251',
      },
      {
        field1: '2',
        field2: 'Fayth',
        field3: 'Blampy',
        field4: 'fblampy1@hubpages.com',
        field5: 'Female',
        field6: '212.76.208.25',
      },
      {
        field1: '3',
        field2: 'Kelli',
        field3: 'Cornock',
        field4: 'kcornock2@boston.com',
      },
    ];
    const res = await csvFormat.doInterpret(data, parameters);
    expect(JSON.parse(res)).toEqual(expected);
  });
});
