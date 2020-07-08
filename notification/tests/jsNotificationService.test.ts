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

    const post = axios.post as jest.Mock

    let notificationService: NotificationService
    
    let successEvent: TransformationEvent   // Event received after successful transformation
    let failEvent: TransformationEvent      // Event received after failed transformation

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

    /**
     * Execution after each test
     */
    afterEach(() => {
      jest.clearAllMocks()
    })

    /**
     * Build the message to fetched by axios mock
     * @param event transoformationEvent, received upon successfull transformation
     */
    function buildMessage(event: TransformationEvent): string {

      let message: string                       // message to return
      const jobError = event.jobResult.error    // Error of transformation (if exists)

      /*======================================================
      *  Build Message for succesfull transformation/pipline
      *=======================================================*/
      if (jobError === undefined) {
        // Build Stats (Time measures for transformation execution)
        const jobStats = event.jobResult.stats
        const start = new Date(jobStats.startTimestamp)
        const end = new Date(jobStats.endTimestamp)


        // Build Success Message
        message = `Pipeline ${event.pipelineName}(Pipeline ID:${event.pipelineId}) ` +
          `has new data available. Fetch at ${event.dataLocation}.

        Transformation Details:
              Start: ${start}
              End:  ${end}
              Duration: ${jobStats.durationInMilliSeconds} ms`
      
      } else {
      /*====================================================
      *  Build Message for failed transformation/pipline
      *====================================================*/
        message = `Pipeline ${event.pipelineName}(Pipeline ID:${event.pipelineId})Failed.

          Details:
            Line: ${jobError.lineNumber}
            Message: ${jobError.message}
            Stacktrace: ${ jobError.stacktrace}`
      }

      return message
    }



    it('should trigger notification when transformation failed and condition is "data == undefined', async () => {
      post.mockReturnValue(Promise.resolve())

      const notificationConfig: WebHookConfig = {
        id: 1,
        pipelineId: 1,
        condition: 'data === undefined',
        url: 'callback'
      }

      await notificationService.handleNotification(notificationConfig, failEvent, CONFIG_TYPE.WEBHOOK)

      const expectedMessage = buildMessage(failEvent)

      expect(post).toHaveBeenCalledTimes(1)
      //check arguments for axios post
      expect(post.mock.calls[0][0]).toEqual(notificationConfig.url)
      expect(post.mock.calls[0][1].location).toEqual(expectedMessage)
    })

    it('should trigger notification when transformation failed and condition is "!data', async () => {
      post.mockReturnValue(Promise.resolve())

      const notificationConfig: WebHookConfig = {
        id: 1,
        pipelineId: 1,
        condition: '!data',
        url: 'callback'
      }

      await notificationService.handleNotification(notificationConfig, failEvent, CONFIG_TYPE.WEBHOOK)

      const expectedMessage = buildMessage(failEvent)

      expect(post).toHaveBeenCalledTimes(1)
      //check arguments for axios post
      expect(post.mock.calls[0][0]).toEqual(notificationConfig.url)
      expect(post.mock.calls[0][1].location).toEqual(expectedMessage)
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

      await notificationService.handleNotification(notificationConfig, successEvent,CONFIG_TYPE.WEBHOOK)

      const expectedMessage = buildMessage(successEvent)

      expect(post).toHaveBeenCalledTimes(1)
      //check arguments for axios post
      expect(post.mock.calls[0][0]).toEqual(notificationConfig.url)
      expect(post.mock.calls[0][1].location).toEqual(expectedMessage)
    })

    /**
     * Test for malformed Condition
     */
    test('Notification does not trigger when condition is malformed', async () => {
      const notificationRequest: WebHookConfig = {
        id: 1,
        pipelineId: 3,
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
        pipelineId: 42,
        workspaceId: '012',
        channelId: '123',
        secret: '42'
      }
      
      await notificationService.handleNotification(request, successEvent, CONFIG_TYPE.SLACK)

      const message = buildMessage(successEvent)

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
