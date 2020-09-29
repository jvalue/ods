/* eslint-env jest */
import axios from 'axios'

import VM2SandboxExecutor from './condition-evaluation/vm2SandboxExecutor'
import { WebhookConfig, SlackConfig } from '../notification-config/notificationConfig'
import NotificationExecutor from './notificationExecutor'
import SlackCallback from '@/notification-execution/notificationCallbacks/slackCallback'

jest.mock('axios')

describe('JSNotificationService', () => {
  describe('notification system', () => {
    // Type assertion is ok here, because we have mocked the whole axios module
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const post = axios.post as jest.Mock

    let notificationService: NotificationExecutor

    let data: object

    beforeEach(() => {
      notificationService = new NotificationExecutor(new VM2SandboxExecutor())
      console.log = jest.fn()
      /* =======================================================
       * An Event sent by the Pipeline Service
       * on successful transformation/pipeline
       * ===================================================== */
      data = { value1: 1, b: 2 }
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should trigger notification when transformation failed and condition is "data == undefined', async () => {
      post.mockReturnValue(Promise.resolve())

      const notificationConfig: WebhookConfig = {
        id: 1,
        pipelineId: 1,
        condition: 'data === undefined',
        url: 'callback'
      }

      const message = 'message'
      const dataLocation = 'location'
      await notificationService.handleWebhook(notificationConfig, dataLocation, message, undefined)

      expect(post).toHaveBeenCalledTimes(1)
      // check arguments for axios post
      expect(post.mock.calls[0][0]).toEqual(notificationConfig.url)
      expect(post.mock.calls[0][1].location).toEqual(dataLocation)
      expect(post.mock.calls[0][1].message).toEqual(message)
    })

    it('should trigger notification when transformation failed and condition is "!data', async () => {
      post.mockReturnValue(Promise.resolve())

      const notificationConfig: WebhookConfig = {
        id: 1,
        pipelineId: 1,
        condition: '!data',
        url: 'callback'
      }

      const message = 'message'
      const dataLocation = 'location'
      await notificationService.handleWebhook(notificationConfig, dataLocation, message, undefined)

      expect(post).toHaveBeenCalledTimes(1)
      // check arguments for axios post
      expect(post.mock.calls[0][0]).toEqual(notificationConfig.url)
      expect(post.mock.calls[0][1].location).toEqual(dataLocation)
      expect(post.mock.calls[0][1].message).toEqual(message)
    })

    it('should trigger notification when condition is met', async () => {
      post.mockReturnValue(Promise.resolve())

      const notificationConfig: WebhookConfig = {
        id: 1,
        pipelineId: 1,
        condition: 'data.value1 > 0',
        url: 'callback'
      }

      const message = 'message'
      const dataLocation = 'location'
      await notificationService.handleWebhook(notificationConfig, dataLocation, message, data)

      expect(post).toHaveBeenCalledTimes(1)
      // check arguments for axios post
      expect(post.mock.calls[0][0]).toEqual(notificationConfig.url)
      expect(post.mock.calls[0][1].location).toEqual(dataLocation)
      expect(post.mock.calls[0][1].message).toEqual(message)
    })

    test('Notification does not trigger when condition is malformed', async () => {
      const notificationConfig: WebhookConfig = {
        id: 1,
        pipelineId: 3,
        condition: 'asdfa;',
        url: 'callback'
      }

      try {
        const message = 'message'
        const dataLocation = 'location'
        await notificationService.handleWebhook(notificationConfig, dataLocation, message, data)
        throw new Error('Fail test')
      } catch (err) {
        expect(err.message).toEqual(
          'Malformed expression received: asdfa;\n Error message: ' +
          'ReferenceError: asdfa is not defined'
        )
      }

      expect(post).not.toHaveBeenCalled()
    })

    test('SLACK request', async () => {
      const request: SlackConfig = {
        id: 1,
        condition: 'data.value1 > 0',
        pipelineId: 42,
        workspaceId: '012',
        channelId: '123',
        secret: '42'
      }

      const message = 'message'
      const dataLocation = 'location'
      await notificationService.handleSlack(request, dataLocation, message, data)

      const expectedObject: SlackCallback = {
        text: message
      }
      expect(post).toHaveBeenCalledTimes(1)
      const expectedUrl = `https://hooks.slack.com/services/${request.workspaceId}/${request.channelId}/${request.secret}`

      expect(post.mock.calls[0][0]).toEqual(expectedUrl)
      expect(post.mock.calls[0][1]).toEqual(expectedObject)
    })
  })
})
