import { Format } from '.';

describe('doInterpret XML Format Returns valid JSON', () => {
  test('convert standard XML to JSON test', () => {
    const xmlFormat = Format.XML;
    const data =
      '<?xml version="1.0" encoding="UTF-8"?><root><to>Tove</to><from>Jani</from><heading>Reminder</heading><body>Don\'t forget me this weekend!</body></root>';
    return xmlFormat.doInterpret(data, {}).then((res) => {
      expect(res).toEqual({
        root: {
          to: 'Tove',
          from: 'Jani',
          heading: 'Reminder',
          body: "Don't forget me this weekend!",
        },
      });
    });
  });

  test('convert nested XML to JSON test', () => {
    const xmlFormat = Format.XML;
    const data =
      '<?xml version="1.0" encoding="UTF-8"?><root><to>Tove</to><from>Jani</from><heading><subheading>ReminderSubheading</subheading><Reminder>Reminder</Reminder></heading><body>Don\'t forget me this weekend!</body></root>';
    return xmlFormat.doInterpret(data, {}).then((res) => {
      expect(res).toEqual({
        root: {
          to: 'Tove',
          from: 'Jani',
          heading: { subheading: 'ReminderSubheading', Reminder: 'Reminder' },
          body: "Don't forget me this weekend!",
        },
      });
    });
  });

  test('convert nested XML to JSON test', () => {
    const xmlFormat = Format.XML;
    const data =
      '<?xml version="1.0" encoding="UTF-8"?><root><to>Tove</to><from>Jani</from><heading><subheading>ReminderSubheading</subheading><Reminder>Reminder1</Reminder><Reminder>Reminder2</Reminder><Reminder>Reminder3</Reminder></heading><body>Don\'t forget me this weekend!</body></root>';
    return xmlFormat.doInterpret(data, {}).then((res) => {
      expect(res).toEqual({
        root: {
          to: 'Tove',
          from: 'Jani',
          heading: {
            subheading: 'ReminderSubheading',
            Reminder: ['Reminder1', 'Reminder2', 'Reminder3'],
          },
          body: "Don't forget me this weekend!",
        },
      });
    });
  });
});
