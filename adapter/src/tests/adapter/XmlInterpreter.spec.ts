import { Format } from '../../adapter/model/enum/Format';

describe('doInterpret XML Format Returns valid JSON', () => {
  test('convert standard XML to JSON test', () => {
    const xmlFormat = Format.XML;
    const data =
      '<?xml version="1.0" encoding="UTF-8"?><note><to>Tove</to><from>Jani</from><heading>Reminder</heading><body>Don\'t forget me this weekend!</body></note>';
    return xmlFormat.doInterpret(data, {}).then((res) => {
      expect(JSON.parse(res)).toEqual({
        to: 'Tove',
        from: 'Jani',
        heading: 'Reminder',
        body: "Don't forget me this weekend!",
      });
    });
  });
  test('convert nested XML to JSON test', () => {
    const xmlFormat = Format.XML;
    const data =
      '<?xml version="1.0" encoding="UTF-8"?><note><to>Tove</to><from>Jani</from><heading><subheading>ReminderSubheading</subheading><Reminder>Reminder</Reminder></heading><body>Don\'t forget me this weekend!</body></note>';
    return xmlFormat.doInterpret(data, {}).then((res) => {
      expect(JSON.parse(res)).toEqual({
        to: 'Tove',
        from: 'Jani',
        heading: { subheading: 'ReminderSubheading', Reminder: 'Reminder' },
        body: "Don't forget me this weekend!",
      });
    });
  });
});
