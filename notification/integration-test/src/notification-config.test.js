/* eslint-env jest */
const request = require('supertest')
const waitOn = require('wait-on')

const URL = process.env.NOTIFICATION_API || 'http://localhost:8080'

const MOCK_RECEIVER_URL = process.env.MOCK_RECEIVER_URL || 'http://localhost:8081'

describe('Notification Service', () => {
  beforeAll(async () => {
    const pingUrl = URL + '/'
    await waitOn({ resources: [pingUrl, MOCK_RECEIVER_URL], timeout: 50000, log: true })
  }, 60000)

  test('should have semantic version', async () => {
    const response = await request(URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')
    const semanticVersionReExp = '^(0|[1-9]d*).(0|[1-9]d*).(0|[1-9]d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionReExp))
  })

  test('should return empty list for non-existing pipeline', async () => {
    const receiverResponse = await request(URL)
      .get('/configs?pipelineId=982323')
      .send()

    expect(receiverResponse.status).toEqual(200)

    // expect empty list
    expect(receiverResponse.body).toEqual([])
  })

  test('should return status 404 on non-existing notification config', async () => {
    const receiverResponse = await request(URL)
      .get('/configs/487749')
      .send()

    expect(receiverResponse.status).toEqual(404)
  })

  test('should create, retrieve, updated, and delete notification config', async () => {
    const webhookConfig = {
      type: 'WEBHOOK',
      pipelineId: 1,
      condition: 'true',
      parameters: {
        url: MOCK_RECEIVER_URL + '/webhook1'
      }
    }

    // POST / CREATE
    let notificationResponse = await request(URL)
      .post('/configs')
      .send(webhookConfig)
    expect(notificationResponse.status).toEqual(201)
    const id = notificationResponse.body.id

    // compare response with initial webhook config
    expect(notificationResponse.body.pipelineId).toEqual(webhookConfig.pipelineId)
    expect(notificationResponse.body.condition).toEqual(webhookConfig.condition)
    expect(notificationResponse.body.parameters.url).toEqual(webhookConfig.parameters.url)

    // PUT / UPDATE
    webhookConfig.pipelineId = 2
    notificationResponse = await request(URL)
      .put(`/configs/${id}`)
      .send(webhookConfig)
    expect(notificationResponse.status).toEqual(200)

    // compare response with initial webhook config
    expect(notificationResponse.body.id).toEqual(id)
    expect(notificationResponse.body.pipelineId).toEqual(webhookConfig.pipelineId)

    // GET / RETRIEVE
    notificationResponse = await request(URL)
      .get(`/configs/${id}`)
      .send()
    expect(notificationResponse.status).toEqual(200)

    // compare response with initial webhook config
    expect(notificationResponse.body.id).toEqual(id)
    expect(notificationResponse.body.pipelineId).toEqual(webhookConfig.pipelineId)
    expect(notificationResponse.body.condition).toEqual(webhookConfig.condition)
    expect(notificationResponse.body.parameters.url).toEqual(webhookConfig.parameters.url)

    // DELETE
    notificationResponse = await request(URL)
      .delete(`/configs/${id}`)
      .send()
    expect(notificationResponse.status).toEqual(200)

    // GET / RETRIEVE not exist
    notificationResponse = await request(URL)
      .get(`/configs/${id}`)
      .send()
    expect(notificationResponse.status).toEqual(404)
  })

  test('should aggregate different types notifications to a list for a pipeline', async () => {
    const webhookConfig = {
      type: 'WEBHOOK',
      pipelineId: 879428,
      condition: 'true',
      parameters: {
        url: MOCK_RECEIVER_URL + '/webhook1'
      }
    }
    const slackConfig = {
      type: 'SLACK',
      pipelineId: webhookConfig.pipelineId,
      condition: 'true',
      parameters: {
        workspaceId: 'workspaceId',
        channelId: 'channelId',
        secret: 'secret'
      }
    }

    // POST / CREATE
    let notificationResponse = await request(URL)
      .post('/configs')
      .send(webhookConfig)
    expect(notificationResponse.status).toEqual(201)
    const webhookId = notificationResponse.body.id

    // POST / CREATE
    notificationResponse = await request(URL)
      .post('/configs')
      .send(slackConfig)
    expect(notificationResponse.status).toEqual(201)
    const slackId = notificationResponse.body.id

    // GET aggregation
    notificationResponse = await request(URL)
      .get(`/configs?pipelineId=${webhookConfig.pipelineId}`)
      .send()

    expect(notificationResponse.status).toEqual(200)
    expect(notificationResponse.body).toContainEqual({
      id: webhookId,
      pipelineId: webhookConfig.pipelineId,
      condition: webhookConfig.condition,
      type: 'WEBHOOK',
      parameters: {
        url: webhookConfig.url
      }
    })
    expect(notificationResponse.body).toContainEqual({
      id: slackId,
      pipelineId: slackConfig.pipelineId,
      condition: slackConfig.condition,
      type: 'SLACK',
      parameters: {
        workspaceId: slackConfig.workspaceId,
        channelId: slackConfig.channelId,
        secret: slackConfig.channelId
      }
    })

    // CLEANUP
    notificationResponse = await request(URL)
      .delete(`/configs/${webhookId}`)
      .send()
    expect(notificationResponse.status).toEqual(200)
  })
})
