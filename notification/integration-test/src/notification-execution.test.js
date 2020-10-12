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

  test('should trigger a configured webhook', async () => {
    // SETUP: store notification config
    const webhookConfig = {
      type: 'WEBHOOK',
      pipelineId: 1,
      condition: 'data.value1 > 0',
      parameter: {
        url: MOCK_RECEIVER_URL + '/webhook1'
      }
    }
    const notificationResponse = await request(URL)
      .post('/configs')
      .send(webhookConfig)
    expect(notificationResponse.status).toEqual(201)

    // SETUP: trigger event
    const triggerEvent = {
      pipelineId: 1,
      pipelineName: 'Integration-Test Pipeline 1',
      data: {
        value1: 1
      }
    }

    // ACT
    const notificationTriggerResponse = await request(URL)
      .post('/trigger')
      .send(triggerEvent)

    expect(notificationTriggerResponse.status).toEqual(200)
    await sleep(3000) // wait for processing

    // ASSERT
    const receiverResponse = await request(MOCK_RECEIVER_URL)
      .get('/webhook1')

    expect(receiverResponse.status).toEqual(200)
    expect(receiverResponse.body.location).toEqual(`http://localhost:9000/storage/${triggerEvent.pipelineId}`)
  }, 10000)

  test('should not trigger webhook if given condition does not hold', async () => {
    // SETUP: store notification config
    const webhookConfig = {
      type: 'WEBHOOK',
      pipelineId: 2,
      condition: 'data.value1 < 0',
      parameter: {
        url: MOCK_RECEIVER_URL + '/webhook2'
      }
    }
    let notificationResponse = await request(URL)
      .post('/configs')
      .send(webhookConfig)
    expect(notificationResponse.status).toEqual(201)
    const id = notificationResponse.body.id

    // SETUP: trigger event
    const dataLocation = 'storage/1234'
    const triggerEvent = {
      pipelineId: 2,
      pipelineName: 'Integration-Test Pipeline 2 (not triggering)',
      dataLocation: dataLocation,
      data: {
        value1: 1
      }
    }
    // ACT
    const notificationTriggerResponse = await request(URL)
      .post('/trigger')
      .send(triggerEvent)
    expect(notificationTriggerResponse.status).toEqual(200)
    await sleep(3000) // wait for processing

    // ASSERT
    const receiverResponse = await request(MOCK_RECEIVER_URL)
      .get('/webhook2')
      .send()
    expect(receiverResponse.status).toEqual(404)

    // CLEANUP
    notificationResponse = await request(URL)
      .delete(`/configs/${id}`)
      .send()
    expect(notificationResponse.status).toEqual(200)
  }, 10000)

  test('should trigger configured slack notification', async () => {
    // SETUP: store notification config
    const slackConfig = {
      type: 'SLACK',
      pipelineId: 3,
      condition: 'typeof data.niceString === "string"',
      parameter: {
        channelId: '12',
        workspaceId: '34',
        secret: '56'
      }
    }
    let notificationResponse = await request(URL)
      .post('/configs')
      .send(slackConfig)
    expect(notificationResponse.status).toEqual(201)
    const id = notificationResponse.body.id

    // SETUP: trigger event
    const triggerEvent = {
      pipelineId: 3,
      pipelineName: 'Integration-Test Pipeline 3 (Slack)',
      data: {
        niceString: 'nice'
      }
    }

    // ACT
    const notificationTriggerResponse = await request(URL)
      .post('/trigger')
      .send(triggerEvent)
    expect(notificationTriggerResponse.status).toEqual(200)
    await sleep(3000) // wait for processing

    // ASSERT
    const receiverResponse = await request(MOCK_RECEIVER_URL)
      .get('/slack/12/34/56')
      .send()

    expect(receiverResponse.status).toEqual(200)
    expect(receiverResponse.body.text).toMatch(`${triggerEvent.pipelineName}`)
    expect(receiverResponse.body.text).toMatch(`${triggerEvent.pipelineId}`)
    expect(receiverResponse.body.text).toMatch(`http://localhost:9000/storage/${triggerEvent.pipelineId}`)

    // CLEANUP
    notificationResponse = await request(URL)
      .delete(`/configs/${id}`)
      .send()
    expect(notificationResponse.status).toEqual(200)
  }, 10000)

  function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
})
