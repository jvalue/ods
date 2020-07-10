/* eslint-env jest */
import axios from 'axios'

import VM2SandboxExecutor from './condition-evaluation/vm2SandboxExecutor'
import { WebHookConfig, NotficationConfigRequest, CONFIG_TYPE, NotificationConfig, SlackConfig } from '../notification-config/notificationConfig';
import NotificationExecutor from './notificationExecutor';
import JSNotificationService from './notificationExecutor';
import { TransformationEvent } from '../api/transformationEvent';
import SlackCallback from '@/notification-execution/notificationCallbacks/slackCallback';

jest.mock('axios')

describe('JSNotificationService', () => {


  describe('notification system', () => {

    const post = axios.post as jest.Mock

    let notificationService: NotificationExecutor

    let data: object

    /**
     * Execution before each test.
     */
    beforeEach(() => {
      notificationService = new JSNotificationService(new VM2SandboxExecutor()) // TODO: replace with mock
      console.log = jest.fn()
      /*=======================================================
       * An Event sent by the Transformation Service
       * on succesful transformation/pipeline
       * =====================================================*/
      data ={ value1: 1, b: 2 }
    })

    /**
     * Execution after each test
     */
    afterEach(() => {
      jest.clearAllMocks()
    })


    it('should trigger notification when transformation failed and condition is "data == undefined', async () => {
      post.mockReturnValue(Promise.resolve())

      const notificationConfig: WebHookConfig = {
        id: 1,
        pipelineId: 1,
        condition: 'data === undefined',
        url: 'callback'
      }

      const message = "message"
      const dataLocation = "location"
      await notificationService.handleNotification(notificationConfig, CONFIG_TYPE.WEBHOOK, dataLocation, message, undefined)


      expect(post).toHaveBeenCalledTimes(1)
      //check arguments for axios post
      expect(post.mock.calls[0][0]).toEqual(notificationConfig.url)
      expect(post.mock.calls[0][1].location).toEqual(dataLocation)
      expect(post.mock.calls[0][1].message).toEqual(message)
    })

    it('should trigger notification when transformation failed and condition is "!data', async () => {
      post.mockReturnValue(Promise.resolve())

      const notificationConfig: WebHookConfig = {
        id: 1,
        pipelineId: 1,
        condition: '!data',
        url: 'callback'
      }

      const message = "message"
      const dataLocation = "location"
      await notificationService.handleNotification(notificationConfig, CONFIG_TYPE.WEBHOOK, dataLocation, message, undefined)

      expect(post).toHaveBeenCalledTimes(1)
      //check arguments for axios post
      expect(post.mock.calls[0][0]).toEqual(notificationConfig.url)
      expect(post.mock.calls[0][1].location).toEqual(dataLocation)
      expect(post.mock.calls[0][1].message).toEqual(message)
    })

    /**
     * Test for transform data and
     */
    it('should trigger notification when condition is met', async () => {
      post.mockReturnValue(Promise.resolve())

      const notificationConfig: WebHookConfig = {
        id: 1,
        pipelineId: 1,
        condition: 'data.value1 > 0',
        url: 'callback'
      }

      const message = "message"
      const dataLocation = "location"
      await notificationService.handleNotification(notificationConfig, CONFIG_TYPE.WEBHOOK, dataLocation, message, data)

      expect(post).toHaveBeenCalledTimes(1)
      //check arguments for axios post
      expect(post.mock.calls[0][0]).toEqual(notificationConfig.url)
      expect(post.mock.calls[0][1].location).toEqual(dataLocation)
      expect(post.mock.calls[0][1].message).toEqual(message)
    })

    /**
     * Test for malformed Condition
     */
    test('Notification does not trigger when condition is malformed', async () => {
      const notificationConfig: WebHookConfig = {
        id: 1,
        pipelineId: 3,
        condition: 'asdfa;',
        url: 'callback'
      }

      try {
        const message = "message"
        const dataLocation = "location"
        await notificationService.handleNotification(notificationConfig, CONFIG_TYPE.WEBHOOK, dataLocation, message, data)
        fail()
      } catch (err) {
        expect(err.message).toEqual("Malformed expression received: asdfa;\n Error message: ReferenceError: asdfa is not defined")
      }

      expect(post).not.toHaveBeenCalled()
    })

    /**
     * Test for Succesful Slack Request
     */
    test('SLACK request', async () => {

      const request: SlackConfig = {
        id:1,
        condition: 'data.value1 > 0',
        pipelineId: 42,
        workspaceId: '012',
        channelId: '123',
        secret: '42'
      }

      const message = "message"
      const dataLocation = "location"
      await notificationService.handleNotification(request, CONFIG_TYPE.SLACK, dataLocation, message, data)

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
