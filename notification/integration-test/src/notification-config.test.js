/* eslint-env jest */
const request = require('supertest')
const waitOn = require('wait-on')

const URL = process.env.NOTIFICATION_API || 'http://localhost:8080'

const MOCK_RECEIVER_PORT = process.env.MOCK_RECEIVER_PORT || 8081
const MOCK_RECEIVER_HOST = process.env.MOCK_RECEIVER_HOST || 'localhost'
const MOCK_RECEIVER_URL = 'http://' + MOCK_RECEIVER_HOST + ':' + MOCK_RECEIVER_PORT

describe('Notification', () => {
  console.log('Notification-Service URL= ' + URL)

  beforeAll(async () => {
    const pingUrl = URL + '/'
    await waitOn({ resources: [pingUrl, MOCK_RECEIVER_URL], timeout: 50000, log: true })
  }, 60000)

  test('GET /version', async () => {
    const response = await request(URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')
    const semanticVersionReExp = '^(0|[1-9]d*).(0|[1-9]d*).(0|[1-9]d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionReExp))
  })

  test('GET /config/pipeline/982323 requests notification configs for non-existing pipeline', async () => {
    const receiverResponse = await request(URL)
      .get('/config/pipeline/982323')
      .send()

    expect(receiverResponse.status).toEqual(200)

    // expect empty list
    expect(receiverResponse.body).toEqual({
      webhook: [],
      slack: [],
      firebase: []
    })
  })

  test('GET /config/slack/487749 request slack config that does not exist', async () => {
    const receiverResponse = await request(URL)
      .get('/config/slack/487749')
      .send()

    expect(receiverResponse.status).toEqual(404)
  })

  test('CRUD Webhook Config', async () => {
    const webhookConfig = {
      pipelineId: 1,
      condition: 'true',
      url: MOCK_RECEIVER_URL + '/webhook1'
    }

    // POST / CREATE
    let notificationResponse = await request(URL)
      .post('/config/webhook')
      .send(webhookConfig)
    expect(notificationResponse.status).toEqual(201)
    const id = notificationResponse.body.id

    // compare response with initial webhook config
    expect(notificationResponse.body.pipelineId).toEqual(webhookConfig.pipelineId)
    expect(notificationResponse.body.condition).toEqual(webhookConfig.condition)
    expect(notificationResponse.body.url).toEqual(webhookConfig.url)

    // PUT / UPDATE
    webhookConfig.pipelineId = 2
    notificationResponse = await request(URL)
      .put(`/config/webhook/${id}`)
      .send(webhookConfig)
    expect(notificationResponse.status).toEqual(200)

    // compare response with initial webhook config
    expect(notificationResponse.body.id).toEqual(id)
    expect(notificationResponse.body.pipelineId).toEqual(webhookConfig.pipelineId)

    // GET / RETRIEVE
    notificationResponse = await request(URL)
      .get(`/config/webhook/${id}`)
      .send()
    expect(notificationResponse.status).toEqual(200)

    // compare response with initial webhook config
    expect(notificationResponse.body.id).toEqual(id)
    expect(notificationResponse.body.pipelineId).toEqual(webhookConfig.pipelineId)
    expect(notificationResponse.body.condition).toEqual(webhookConfig.condition)
    expect(notificationResponse.body.url).toEqual(webhookConfig.url)

    // DELETE
    notificationResponse = await request(URL)
      .delete(`/config/webhook/${id}`)
      .send()
    expect(notificationResponse.status).toEqual(200)

    // GET / RETRIEVE not exist
    notificationResponse = await request(URL)
      .get(`/config/webhook/${id}`)
      .send()
    expect(notificationResponse.status).toEqual(404)
  })

  test('Get All Notification Configs for Pipeline', async () => {
    const webhookConfig = {
      pipelineId: 879428,
      condition: 'true',
      url: MOCK_RECEIVER_URL + '/webhook1'
    }

    // POST / CREATE
    let notificationResponse = await request(URL)
      .post('/config/webhook')
      .send(webhookConfig)
    expect(notificationResponse.status).toEqual(201)
    const id = notificationResponse.body.id

    notificationResponse = await request(URL)
      .get(`/config/pipeline/${webhookConfig.pipelineId}`)
      .send()

    expect(notificationResponse.status).toEqual(200)
    expect(notificationResponse.body).toEqual({
      webhook: [{
        id: id,
        pipelineId: webhookConfig.pipelineId,
        condition: webhookConfig.condition,
        url: webhookConfig.url
      }],
      slack: [],
      firebase: []
    })

    // CLEANUP
    notificationResponse = await request(URL)
      .delete(`/config/webhook/${id}`)
      .send()
    expect(notificationResponse.status).toEqual(200)
  })
})
