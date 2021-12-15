import { JsonSchemaElementArray } from '../service/sharedHelper';

export const JSONSchemaOrdngungsamtComplete = {
  $schema: 'schema-recommendation/jsonschema/parser',
  $id: '#/root',
  type: 'object',
  additionalProperties: true,
  required: ['messages', 'results', 'index'],
  properties: {
    messages: {
      $id: '#/root/messages',
      type: 'object',
      additionalProperties: true,
      required: ['messages', 'success'],
      properties: {
        messages: {
          $id: '#/root/messages/messages',
          type: 'array',
          additionalItems: true,
          items: {
            $id: '#/root/messages/messages/items',
          },
        },
        success: {
          $id: '#/root/messages/success',
          type: 'boolean',
        },
      },
    },
    results: {
      $id: '#/root/results',
      type: 'object',
      additionalProperties: true,
      required: ['count', 'itemsPerPage'],
      properties: {
        count: {
          $id: '#/root/results/count',
          type: 'number',
        },
        itemsPerPage: {
          $id: '#/root/results/itemsPerPage',
          type: 'number',
        },
      },
    },
    index: {
      $id: '#/root/index',
      type: 'array',
      additionalItems: true,
      items: {
        $id: '#/root/index/items',
        type: 'object',
        additionalProperties: true,
        required: [
          'meldungsNummern',
          'bezirk',
          'betreff',
          'erstellungsDatum',
          'status',
          'sachverhalt',
        ],
        properties: {
          meldungsNummern: {
            $id: '#/root/index/items/meldungsNummern',
            type: 'array',
            additionalItems: true,
            items: {
              $id: '#/root/index/items/meldungsNummern/items',
              type: 'string',
            },
          },
          bezirk: {
            $id: '#/root/index/items/bezirk',
            type: 'string',
          },
          betreff: {
            $id: '#/root/index/items/betreff',
            type: 'string',
          },
          erstellungsDatum: {
            $id: '#/root/index/items/erstellungsDatum',
            type: 'string',
          },
          status: {
            $id: '#/root/index/items/status',
            type: 'string',
          },
          sachverhalt: {
            $id: '#/root/index/items/sachverhalt',
            type: 'string',
          },
        },
      },
    },
  },
};

export const JSONSchemaPegelComplete: JsonSchemaElementArray = {
  $schema: 'schema-recommendation/jsonschema/parser',
  $id: '#/root',
  type: 'array',
  additionalItems: true,
  items: {
    $id: '#/root/items',
    type: 'object',
    additionalProperties: true,
    required: [
      'uuid',
      'number',
      'shortname',
      'longname',
      'km',
      'agency',
      'longitude',
      'latitude',
      'water',
    ],
    properties: {
      uuid: {
        $id: '#/root/items/uuid',
        type: 'string',
      },
      number: {
        $id: '#/root/items/number',
        type: 'string',
      },
      shortname: {
        $id: '#/root/items/shortname',
        type: 'string',
      },
      longname: {
        $id: '#/root/items/longname',
        type: 'string',
      },
      km: {
        $id: '#/root/items/km',
        type: 'number',
      },
      agency: {
        $id: '#/root/items/agency',
        type: 'string',
      },
      longitude: {
        $id: '#/root/items/longitude',
        type: 'number',
      },
      latitude: {
        $id: '#/root/items/latitude',
        type: 'number',
      },
      water: {
        $id: '#/root/items/water',
        type: 'object',
        additionalProperties: true,
        required: ['shortname', 'longname'],
        properties: {
          shortname: {
            $id: '#/root/items/water/shortname',
            type: 'string',
          },
          longname: {
            $id: '#/root/items/water/longname',
            type: 'string',
          },
        },
      },
    },
  },
};

export const MultiCompleteOrdnungsamt = {
  messages: {
    success: true,
  },
  results: {
    count: 1,
    itemsPerPage: 2,
  },
  index: [
    {
      meldungsNummern: ['Hallo', 'Welt'],
      bezirk: '48900237',
      betreff: 'FIRST',
      erstellungsDatum: 'FIRST',
      status: '9.56',
      sachverhalt: 'WSA VERDEN',
    },
    {
      meldungsNummern: ['Hallo', 'Welt'],
      bezirk: '48900237',
      betreff: 'SECOND',
      erstellungsDatum: 'SECOND',
      status: '9.56',
      sachverhalt: 'WSA VERDEN',
    },
  ],
};

export const MultiCompletePegel = [
  {
    uuid: '1',
    number: '48900237',
    shortname: 'FIRST',
    longname: 'FIRST',
    km: 9.56,
    agency: 'WSA VERDEN',
    longitude: 9.27676943537587,
    latitude: 52.90406541008721,
    water: {
      shortname: 'FIRST',
      longname: 'FIRST',
    },
  },
  {
    uuid: '2',
    number: '48900237',
    shortname: 'SECOND',
    longname: 'SECOND',
    km: 9.56,
    agency: 'WSA VERDEN',
    longitude: 9.27676943537587,
    latitude: 52.90406541008721,
    water: {
      shortname: 'SECOND',
      longname: 'SECOND',
    },
  },
];

export const PostgresSchemaPegelCreate = [
  'CREATE TABLE IF NOT EXISTS "TESTSCHEMA"."TESTTABLE" (' +
    '"id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY, ' +
    '"createdAt" timestamp not null default CURRENT_TIMESTAMP, ' +
    '"uuid" text, "number" text, "shortname" text, "longname" text, ' +
    '"km" integer, "agency" text, "longitude" integer, "latitude" integer, ' +
    'CONSTRAINT "Data_pk_TESTSCHEMA_TESTTABLE" PRIMARY KEY (id)' +
    ')',
  'CREATE TABLE IF NOT EXISTS "TESTSCHEMA"."TESTTABLE_water" (' +
    '"id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY, ' +
    '"createdAt" timestamp not null default CURRENT_TIMESTAMP, ' +
    '"shortname" text, "longname" text, "TESTTABLEid" bigint NOT NULL, ' +
    'CONSTRAINT "Data_fk_TESTSCHEMA_TESTTABLE_water" FOREIGN KEY (TESTTABLEid) ' +
    'REFERENCES TESTSCHEMA.TESTTABLE(id), ' +
    'CONSTRAINT "Data_pk_TESTSCHEMA_TESTTABLE_water" PRIMARY KEY (id)' +
    ')',
];

/* Export const PostgresSchemaMultiPegelInsert =
  'INSERT INTO "TESTSCHEMA"."TESTTABLE" (' +
  '"uuid","number","shortname","longname","km","agency","longitude","latitude")' +
  ' VALUES ('1','48900237','FIRST','FIRST',9.56,'WSA VERDEN',9.27676943537587,52.90406541008721)` +
  ' RETURNING *;' +
  'INSERT INTO "TESTSCHEMA"."TESTTABLE_water" (' +
  `"shortname","longname","TESTTABLEid") VALUES ('FIRST','FIRST',0) RETURNING *;` +
  'INSERT INTO "TESTSCHEMA"."TESTTABLE" (' +
  '"uuid","number","shortname","longname","km","agency","longitude","latitude")' +
  ` VALUES ('2','48900237','SECOND','SECOND',9.56,'WSA VERDEN',9.27676943537587,52.90406541008721) RETURNING *;` +
  'INSERT INTO "TESTSCHEMA"."TESTTABLE_water" (' +
  `"shortname","longname","TESTTABLEid") VALUES ('SECOND','SECOND',1) RETURNING *;`
*/
