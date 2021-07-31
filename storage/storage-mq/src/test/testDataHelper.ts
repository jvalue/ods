export const JSONSchemaOrdngungsamtComplete = {
  $schema: 'schema-recommendation/jsonschema/parser',
  $id: '#/root',
  type: 'object',
  additionalProperties: true,
  required: [
    'messages',
    'results',
    'index'
  ],
  properties: {
    messages: {
      $id: '#/root/messages',
      type: 'object',
      additionalProperties: true,
      required: [
        'messages',
        'success'
      ],
      properties: {
        messages: {
          $id: '#/root/messages/messages',
          type: 'array',
          additionalItems: true,
          items: {
            $id: '#/root/messages/messages/items'
          }
        },
        success: {
          $id: '#/root/messages/success',
          type: 'boolean'
        }
      }
    },
    results: {
      $id: '#/root/results',
      type: 'object',
      additionalProperties: true,
      required: [
        'count',
        'itemsPerPage'
      ],
      properties: {
        count: {
          $id: '#/root/results/count',
          type: 'number'
        },
        itemsPerPage: {
          $id: '#/root/results/itemsPerPage',
          type: 'number'
        }
      }
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
          'id',
          'meldungsNummern',
          'bezirk',
          'betreff',
          'erstellungsDatum',
          'status',
          'sachverhalt'
        ],
        properties: {
          id: {
            $id: '#/root/index/items/id',
            type: 'number'
          },
          meldungsNummern: {
            $id: '#/root/index/items/meldungsNummern',
            type: 'array',
            additionalItems: true,
            items: {
              $id: '#/root/index/items/meldungsNummern/items',
              type: 'string'
            }
          },
          bezirk: {
            $id: '#/root/index/items/bezirk',
            type: 'string'
          },
          betreff: {
            $id: '#/root/index/items/betreff',
            type: 'string'
          },
          erstellungsDatum: {
            $id: '#/root/index/items/erstellungsDatum',
            type: 'string'
          },
          status: {
            $id: '#/root/index/items/status',
            type: 'string'
          },
          sachverhalt: {
            $id: '#/root/index/items/sachverhalt',
            type: 'string'
          }
        }
      }
    }
  }
}

export const JSONSchemaPegelComplete = {
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
      'water'
    ],
    properties: {
      uuid: {
        $id: '#/root/items/uuid',
        type: 'string'
      },
      number: {
        $id: '#/root/items/number',
        type: 'string'
      },
      shortname: {
        $id: '#/root/items/shortname',
        type: 'string'
      },
      longname: {
        $id: '#/root/items/longname',
        type: 'string'
      },
      km: {
        $id: '#/root/items/km',
        type: 'number'
      },
      agency: {
        $id: '#/root/items/agency',
        type: 'string'
      },
      longitude: {
        $id: '#/root/items/longitude',
        type: 'number'
      },
      latitude: {
        $id: '#/root/items/latitude',
        type: 'number'
      },
      water: {
        $id: '#/root/items/water',
        type: 'object',
        additionalProperties: true,
        required: [
          'shortname',
          'longname'
        ],
        properties: {
          shortname: {
            $id: '#/root/items/water/shortname',
            type: 'string'
          },
          longname: {
            $id: '#/root/items/water/longname',
            type: 'string'
          }
        }
      }
    }
  }
}
