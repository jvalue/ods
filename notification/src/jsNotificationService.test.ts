/* eslint-env jest */
import axios from 'axios'

import VM2SandboxExecutor from './vm2SandboxExecutor'
import { WebHookConfig, NotficationConfigRequest, CONFIG_TYPE, NotificationConfig } from './models/notificationConfig';
import NotificationService from './interfaces/notificationService';
import JSNotificationService from './jsNotificationService';

jest.mock('axios')

describe('JSNotificationService', () => {


  describe('notification system', () => {
    const data = {
      value1: 5
    }

    const post = axios.post as jest.Mock

    let notificationService: NotificationService

    beforeEach(() => {
      notificationService = new JSNotificationService(new VM2SandboxExecutor()) // TODO: replace with mock
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should trigger notification when condition is met', async () => {
      post.mockReturnValue(Promise.resolve())

      const notificationConfig: WebHookConfig = {
        id: 1,
        pipelineName: 'nordstream',
        pipelineId: 1,
        dataLocation: 'data',
        condition: 'data.value1 > 0',
        url: 'callback'
      }

      // await notificationService.handleNotification(notificationConfig,'WEBHHOK')

      // expect(post).toHaveBeenCalledTimes(1)
      // check arguments for axios post
      // expect(post.mock.calls[0][0]).toEqual(notificationRequest.url)
      // expect(post.mock.calls[0][1].location).toEqual(notificationRequest.dataLocation)
    })

    test('Notification does not trigger when condition is not met', async () => {
      const notificationRequest = {
        pipelineName: 'southstream',
        pipelineId: 2,
        dataLocation: 'data',
        condition: 'data.value1 < 0',
        type: 'WEBHOOK',
        url: 'callback'
      }

      // await notificationService.handleNotification(notificationRequest)

      //expect(post).not.toHaveBeenCalled()
    })

    test('Notification does not trigger when condition is malformed', async () => {
      const notificationRequest = {
        pipelineName: 'weststream',
        pipelineId: 3,
        dataLocation: 'data',
        condition: 'asdfa;',
        type: 'WEBHOOK',
        url: 'callback'
      }


      // try {
      //   await notificationService.handleNotification(notificationRequest)
      //   fail()
      // } catch (err) {
      //   expect(err.message).toEqual("Malformed expression received: asdfa;\n Error message: ReferenceError: asdfa is not defined")
      // }

      // expect(post).not.toHaveBeenCalled()
    })

    test('SLACK request', async () => {
      const request = {
        condition: 'data.value1 > 0',
        dataLocation: 'data',
        pipelineId: 42,
        pipelineName: 'AnswerToEverything-Pipeline',
        type: 'SLACK',
        workspaceId: '012',
        channelId: '123',
        secret: '42'
      }
      // await notificationService.handleNotification(request)

      // const expectedObject: SlackCallback = {
      //   text: `Pipeline ${request.pipelineName}(${request.pipelineId}) has new data available. Fetch at ${request.dataLocation}.`
      // }
      // expect(post).toHaveBeenCalledTimes(1)
      // const expectedUrl = `https://hooks.slack.com/services/${request.workspaceId}/${request.channelId}/${request.secret}`
      // expect(post.mock.calls[0][0]).toEqual(expectedUrl)
      // expect(post.mock.calls[0][1]).toEqual(expectedObject)
    })
  })
})
