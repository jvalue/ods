const { setTimeout: sleep } = require('timers/promises')

const { AmqpConnection } = require('@jvalue/node-dry-amqp')
const request = require('supertest')
const waitOn = require('wait-on')

const { consumeTopics } = require('./amqp-msg-consumer')

const URL = process.env.PIPELINE_API || 'http://localhost:8080'

const AMQP_URL = process.env.AMQP_URL
const AMQP_EXCHANGE = process.env.AMQP_EXCHANGE
const AMQP_IT_QUEUE = process.env.AMQP_IT_QUEUE
const AMQP_PIPELINE_CONFIG_CREATED_TOPIC = process.env.AMQP_PIPELINE_CONFIG_CREATED_TOPIC
const AMQP_PIPELINE_CONFIG_UPDATED_TOPIC = process.env.AMQP_PIPELINE_CONFIG_UPDATED_TOPIC
const AMQP_PIPELINE_CONFIG_DELETED_TOPIC = process.env.AMQP_PIPELINE_CONFIG_DELETED_TOPIC
const CONNECTION_RETRIES = +process.env.CONNECTION_RETRIES
const CONNECTION_BACKOFF = +process.env.CONNECTION_BACKOFF

const PUBLICATION_WAIT_TIME_MS = +process.env.PUBLICATION_WAIT_TIME_MS

let amqpConnection
let getPublishedEvent

describe('Pipeline Config Test', () => {
  beforeAll(async () => {
    console.log('Starting pipeline config tests..')
    const pingUrl = URL + '/version'
    await waitOn({ resources: [pingUrl], timeout: 50000, log: true })
    console.log('[online] Service with URL:  ' + pingUrl)

    amqpConnection = new AmqpConnection(AMQP_URL, CONNECTION_RETRIES, CONNECTION_BACKOFF)
    getPublishedEvent = await consumeTopics(amqpConnection, AMQP_EXCHANGE, AMQP_IT_QUEUE, [
      AMQP_PIPELINE_CONFIG_CREATED_TOPIC,
      AMQP_PIPELINE_CONFIG_UPDATED_TOPIC,
      AMQP_PIPELINE_CONFIG_DELETED_TOPIC
    ])
  }, 60000)

  afterAll(async () => {
    await amqpConnection?.close()

    // clear stored configs
    await request(URL)
      .delete('/configs')
      .send()
  })

  test('GET /configs', async () => {
    const response = await request(URL).get('/configs')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')

    expect(response.body).toEqual([])
  })

  test('POST & DELETE /configs', async () => {
    const response = await request(URL)
      .post('/configs')
      .send(pipelineConfig)

    expect(response.status).toEqual(201)
    const configId = response.body.id
    expect(response.header.location).toEqual('/configs/1')

    expect(response.body.id).toBeDefined()
    expect(configId).not.toEqual(pipelineConfig.id) // id not under control of client
    expect(response.body.datasourceId).toEqual(pipelineConfig.datasourceId)

    expect(response.body.transformation).toEqual(pipelineConfig.transformation)

    expect(response.body.metadata.author).toEqual(pipelineConfig.metadata.author)
    expect(response.body.metadata.description).toEqual(pipelineConfig.metadata.description)
    expect(response.body.metadata.displayName).toEqual(pipelineConfig.metadata.displayName)
    expect(response.body.metadata.license).toEqual(pipelineConfig.metadata.license)
    expect(response.body.metadata.creationTimestamp).toBeDefined()

    const delResponse = await request(URL)
      .delete('/configs/' + configId)
      .send()

    expect(delResponse.status).toEqual(204)

    await sleep(PUBLICATION_WAIT_TIME_MS)
    expect(getPublishedEvent(AMQP_PIPELINE_CONFIG_CREATED_TOPIC)).toContainEqual({
      pipelineId: configId,
      pipelineName: pipelineConfig.metadata.displayName
    })
    expect(getPublishedEvent(AMQP_PIPELINE_CONFIG_DELETED_TOPIC)).toContainEqual({
      pipelineId: configId,
      pipelineName: pipelineConfig.metadata.displayName
    })
  })

  test('PUT & DELETE /configs/{id}', async () => {
    const postResponse = await request(URL)
      .post('/configs')
      .send(pipelineConfig)

    const configId = postResponse.body.id
    const originalGetResponse = await request(URL)
      .get('/configs/' + configId)

    const updatedConfig = Object.assign({}, pipelineConfig)
    updatedConfig.datasourceId = 999

    const putResponse = await request(URL)
      .put('/configs/' + configId)
      .send(updatedConfig)

    expect(putResponse.status).toEqual(204)

    const updatedGetResponse = await request(URL)
      .get('/configs/' + configId)

    expect(originalGetResponse.body.transformation).toEqual(updatedGetResponse.body.transformation)
    expect(originalGetResponse.body.metadata).toEqual(updatedGetResponse.body.metadata)
    expect(originalGetResponse.body.id).toEqual(updatedGetResponse.body.id)
    expect(originalGetResponse.body.datasourceId).not.toEqual(updatedGetResponse.body.datasourceId)

    const delResponse = await request(URL)
      .delete('/configs/' + configId)
      .send()

    expect(delResponse.status).toEqual(204)

    await sleep(PUBLICATION_WAIT_TIME_MS)
    expect(getPublishedEvent(AMQP_PIPELINE_CONFIG_CREATED_TOPIC)).toContainEqual({
      pipelineId: configId,
      pipelineName: pipelineConfig.metadata.displayName
    })
    expect(getPublishedEvent(AMQP_PIPELINE_CONFIG_UPDATED_TOPIC)).toContainEqual({
      pipelineId: configId,
      pipelineName: pipelineConfig.metadata.displayName
    })
    expect(getPublishedEvent(AMQP_PIPELINE_CONFIG_DELETED_TOPIC)).toContainEqual({
      pipelineId: configId,
      pipelineName: pipelineConfig.metadata.displayName
    })
  })

  test('DELETE /configs/', async () => {
    const response1 = await request(URL)
      .post('/configs')
      .send(pipelineConfig)
    const config1Id = response1.body.id
    const response2 = await request(URL)
      .post('/configs')
      .send(pipelineConfig)
    const config2Id = response2.body.id

    const delResponse = await request(URL)
      .delete('/configs/')
      .send()

    expect(delResponse.status).toEqual(204)

    await sleep(PUBLICATION_WAIT_TIME_MS)
    expect(getPublishedEvent(AMQP_PIPELINE_CONFIG_DELETED_TOPIC)).toContainEqual({
      pipelineId: config1Id,
      pipelineName: pipelineConfig.metadata.displayName
    })
    expect(getPublishedEvent(AMQP_PIPELINE_CONFIG_DELETED_TOPIC)).toContainEqual({
      pipelineId: config2Id,
      pipelineName: pipelineConfig.metadata.displayName
    })
  })

  test('Persist long transformation function', async () => {
    const configToPersist = Object.assign({}, pipelineConfig)
    const crazyLongPipeline = {
      func: 'a'.repeat(256)
    }
    configToPersist.transformation = crazyLongPipeline

    // create pipeline to persist
    const creationResponse = await request(URL)
      .post('/configs')
      .send(configToPersist)

    expect(creationResponse.status).toEqual(201)
    const pipelineId = creationResponse.body.id

    // check persisted pipeline config
    const pipelineResponse = await request(URL)
      .get(`/configs/${pipelineId}`)
      .send()

    expect(pipelineResponse.body.transformation).toEqual(crazyLongPipeline)

    // clean up
    await request(URL)
      .delete(`/configs/${pipelineId}`)
      .send()
  })
})

const pipelineConfig = {
  id: 12345,
  datasourceId: 1,
  transformation: {
    func: 'return data+data;'
  },
  metadata: {
    author: 'icke',
    license: 'none',
    displayName: 'test pipeline',
    description: 'integraiton testing pipeline'
  }
}
