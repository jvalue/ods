/* eslint-env jest */
import axios from 'axios'

import VM2SandboxExecutor from '../src/vm2SandboxExecutor'
import { WebHookConfig, NotficationConfigRequest, CONFIG_TYPE, NotificationConfig, SlackConfig } from '../src/models/notificationConfig';
import NotificationService from '../src/interfaces/notificationService';
import JSNotificationService from '../src/jsNotificationService';
import { TransformationEvent } from '../src/interfaces/transformationResults/transformationEvent';
import SlackCallback from '@/interfaces/notificationCallbacks/slackCallback';

jest.mock('axios')

describe('JSNotificationService', () => {


  describe('notification system', () => {
    const data = {
      value1: 5
    }

    const post = axios.post as jest.Mock

    let notificationService: NotificationService
    
    let successEvent: TransformationEvent   // Event received after successful transformation
    let failEvent: TransformationEvent      // Event received after failed transformation

    beforeEach(() => {
      notificationService = new JSNotificationService(new VM2SandboxExecutor()) // TODO: replace with mock
      console.log = jest.fn()
      /*=======================================================
       * An Event sent by the Transformation Service 
       * on succesful transformation/pipeline
       * =====================================================*/
      successEvent = {
        pipelineId: 1,
        pipelineName: 'nordstream',
        dataLocation: 'somewhere',

        jobResult: {
          data: { value1: 1, b: 2 },
          error: undefined,

          stats: {
            durationInMilliSeconds: 1,
            startTimestamp: 1,
            endTimestamp: 1,
          }
        }
      }
      
      /*================================================
       *Build Event for failed transformation
       *===============================================*/
      failEvent = {
        pipelineId: 1,
        pipelineName: 'nordstream',
        dataLocation: 'somewhere',

        jobResult: {
          data: undefined,
          error: {
            name: 'Error',
            message: 'Transformation failed',
            lineNumber: 1,
            position: 1,
            stacktrace: ['Line 1', 'Line 2']
          },

          stats: {
            durationInMilliSeconds: 1,
            startTimestamp: 1,
            endTimestamp: 1,
          }
        }
      }


    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should trigger notification when transformation failed and condition is "data == undefined', async () => {
      post.mockReturnValue(Promise.resolve())

      const notificationConfig: WebHookConfig = {
        id: 1,
        pipelineName: 'nordstream',
        pipelineId: 1,
        dataLocation: 'data',
        condition: 'data === undefined',
        url: 'callback'
      }

      await notificationService.handleNotification(notificationConfig, failEvent, CONFIG_TYPE.WEBHOOK)

      expect(post).toHaveBeenCalledTimes(1)
      //check arguments for axios post
      expect(post.mock.calls[0][0]).toEqual(notificationConfig.url)
      expect(post.mock.calls[0][1].location).toEqual(notificationConfig.dataLocation)
    })

    it('should trigger notification when transformation failed and condition is "!data', async () => {
      post.mockReturnValue(Promise.resolve())

      const notificationConfig: WebHookConfig = {
        id: 1,
        pipelineName: 'nordstream',
        pipelineId: 1,
        dataLocation: 'data',
        condition: '!data',
        url: 'callback'
      }

      await notificationService.handleNotification(notificationConfig, failEvent, CONFIG_TYPE.WEBHOOK)

      expect(post).toHaveBeenCalledTimes(1)
      //check arguments for axios post
      expect(post.mock.calls[0][0]).toEqual(notificationConfig.url)
      expect(post.mock.calls[0][1].location).toEqual(notificationConfig.dataLocation)
    })

    /**
     * Test for transform data and 
     */
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

      await notificationService.handleNotification(notificationConfig, successEvent,CONFIG_TYPE.WEBHOOK)

      expect(post).toHaveBeenCalledTimes(1)
      //check arguments for axios post
      expect(post.mock.calls[0][0]).toEqual(notificationConfig.url)
      expect(post.mock.calls[0][1].location).toEqual(notificationConfig.dataLocation)
    })

    /**
     * Test for malformed Condition
     */
    test('Notification does not trigger when condition is malformed', async () => {
      const notificationRequest: WebHookConfig = {
        id: 1,
        pipelineName: 'weststream',
        pipelineId: 3,
        dataLocation: 'data',
        condition: 'asdfa;',
        url: 'callback'
      }

      try {
        await notificationService.handleNotification(notificationRequest, successEvent, CONFIG_TYPE.WEBHOOK)
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
        dataLocation: 'data',
        pipelineId: 42,
        pipelineName: 'AnswerToEverything-Pipeline',
        workspaceId: '012',
        channelId: '123',
        secret: '42'
      }
      
      await notificationService.handleNotification(request, successEvent, CONFIG_TYPE.SLACK)

      /*======================================================
      *  Build Message for succesfull transformation/pipline
      *=======================================================*/
      // Build Stats (Time measures for transformation execution)
      const jobStats = successEvent.jobResult.stats
      const start = new Date(jobStats.startTimestamp)
      const end = new Date(jobStats.endTimestamp)


      // Build Success Message
      const message = `Pipeline ${successEvent.pipelineName}(Pipeline ID:${successEvent.pipelineId}) ` +
        `has new data available. Fetch at ${successEvent.dataLocation}.

      Transformation Details:
            Start: ${start}
            End:  ${end}
            Duration: ${jobStats.durationInMilliSeconds} ms`


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
