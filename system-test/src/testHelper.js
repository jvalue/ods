const request = require('supertest')

function generateDataSourceConfig (sourceLocation, periodic, interval = 5000) {
  return {
    protocol: {
      type: 'HTTP',
      parameters: {
        location: sourceLocation,
        encoding: 'UTF-8'
      }
    },
    format: {
      type: 'JSON',
      parameters: {}
    },
    trigger: {
      firstExecution: new Date(Date.now() + 3000),
      periodic,
      interval
    },
    metadata: {
      author: 'Klaus Klausemeier',
      license: 'AGPL v30',
      displayName: 'test1',
      description: 'system test 1'
    },
    schema: {
      test: 1
    }
  }
}

function generatePipelineConfig (datasourceId) {
  return {
    datasourceId: datasourceId,
    transformation: undefined,
    metadata: {
      author: 'Klaus Klausemeier',
      license: 'AGPL v30',
      displayName: 'test1',
      description: 'system test 1'
    }
  }
}

function generateSourceData () {
  return {
    one: 1,
    two: 'two',
    objecticus: {
      inner: 'value'
    }
  }
}

function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function checkWebhook (uri, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await request(uri).get('/')
    if (response.status === 200) {
      return response
    }

    await sleep(5000)
  }

  throw new Error(`Webhook ${uri} was not triggered within ${maxRetries} retries.`)
}

module.exports = {
  generateDataSourceConfig,
  generatePipelineConfig,
  generateSourceData,
  checkWebhook,
  sleep
}
