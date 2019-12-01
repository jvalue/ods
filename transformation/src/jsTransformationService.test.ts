/* eslint-env jest */
import axios from 'axios'
import {initializeApp as firebaseInit, messaging as firebaseMessaging}from 'firebase-admin'

import { NotificationRequest, NotificationType } from './interfaces/notificationRequest'
import TransformationService from './interfaces/transformationService'

import JSTransformationService from './jsTransformationService'
import VM2SandboxExecutor from './vm2SandboxExecutor'
import SandboxExecutor from './interfaces/sandboxExecutor'
import SlackCallback from './interfaces/slackCallback'
import fcmCallback from './interfaces/fcmCallback'

jest.mock('axios')
jest.mock('firebase-admin')

describe('JSTransformationService', () => {
  describe('valid execution', () => {
    let transformationService: TransformationService
    let sandboxExecutorMock: jest.Mocked<SandboxExecutor>

    beforeEach(() => {
      const SandboxMock = jest.fn(() => ({
        execute: jest.fn((func, data) => ({ data: {}, error: undefined })),
        evaluate: jest.fn()
      }))
      sandboxExecutorMock = new SandboxMock()
      transformationService = new JSTransformationService(sandboxExecutorMock)
    })

    it('should call execute on the sandbox', () => {
      transformationService.executeJob('return 1;', {})
      expect(sandboxExecutorMock.execute).toHaveBeenCalled()
    })

    it('should return an object with stats', () => {
      const jobResult = transformationService.executeJob('return 1;', {})
      expect(jobResult.stats.durationInMilliSeconds).toBeGreaterThan(0)
      expect(jobResult.stats.endTimestamp).toBeGreaterThanOrEqual(jobResult.stats.startTimestamp)
    })
  })

  describe('invalid execution', () => {
    let transformationService: TransformationService
    let sandboxExecutorMock: jest.Mocked<SandboxExecutor>

    beforeEach(() => {
      const SandboxMock = jest.fn(() => ({
        execute: jest.fn((func, data) => ({ data: undefined, error: undefined })),
        evaluate: jest.fn()
      }))
      sandboxExecutorMock = new SandboxMock()
      transformationService = new JSTransformationService(sandboxExecutorMock)
    })

    it('should return an error if no return clause is included', () => {
      const jobResult = transformationService.executeJob('data.a = 1;', { a: 2 })
      expect(jobResult.data).toBeUndefined()
      if (jobResult.error === undefined) {
        fail()
        return
      }
      expect(jobResult.error.name).toBe('MissingReturnError')
    })
  })

  describe('notification system', () => {
    const data = {
      value1: 5
    }


    const post = axios.post as jest.Mock

    let transformationService: TransformationService

    beforeEach(() => {
      transformationService = new JSTransformationService(new VM2SandboxExecutor()) // TODO: replace with mock
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should trigger notification when condition is met', async () => {
      post.mockReturnValue(Promise.resolve())

      const notificationRequest: NotificationRequest = {
        pipelineName: 'nordstream',
        pipelineId: 1,
        url: 'callback',
        dataLocation: 'data',
        data: data,
        condition: 'data.value1 > 0',
        notificationType: NotificationType.WEBHOOK
      }

      await transformationService.handleNotification(notificationRequest)

      expect(post).toHaveBeenCalledTimes(1)
      // check arguments for axios post
      expect(post.mock.calls[0][0]).toEqual(notificationRequest.url)
      expect(post.mock.calls[0][1].location).toEqual(notificationRequest.dataLocation)
    })

    test('Notification does not trigger when condition is not met', async () => {
      const notificationRequest: NotificationRequest = {
        pipelineName: 'southstream',
        pipelineId: 2,
        url: 'callback',
        dataLocation: 'data',
        data: data,
        condition: 'data.value1 < 0',
        notificationType: NotificationType.WEBHOOK
      }

      await transformationService.handleNotification(notificationRequest)

      expect(post).not.toHaveBeenCalled()
    })

    test('Notification does not trigger when condition is malformed', async () => {
      const notificationRequest: NotificationRequest = {
        pipelineName: 'weststream',
        pipelineId: 3,
        url: 'callback',
        dataLocation: 'data',
        data: data,
        condition: 'asdfa;',
        notificationType: NotificationType.WEBHOOK
      }

      await transformationService.handleNotification(notificationRequest)

      expect(post).not.toHaveBeenCalled()
    })

    test('FCM request', async () => {
      const request: NotificationRequest = {
        condition: 'data.value1 > 0',
        data,
        dataLocation: 'data',
        notificationType: NotificationType.FCM,
        pipelineId: 42,
        pipelineName: 'AnswerToEverything-Pipeline',
        url: 'yo'
      }
      const expectedObject: fcmCallback = {
        notification: {
          title: 'New Data Available',
          body: `Pipeline ${request.pipelineName}(${request.pipelineId}) has new data available.` +
            `Fetch at ${request.dataLocation}.`
        },
        topic: 'test'
      }
      await transformationService.handleNotification(request)

      expect(init).toHaveBeenCalledTimes(1)
      expect(send).toHaveBeenCalledWith({
        notification: {
          title: 'New Data Available',
          body: `Pipeline ${request.pipelineName}(${request.pipelineId}) has new data available.` +
            `Fetch at ${request.dataLocation}.`
        },
        topic: 'test'
      })
    })

    test('SLACK request', async () => {
      const request: NotificationRequest = {
        condition: 'data.value1 > 0',
        data,
        dataLocation: 'data',
        notificationType: NotificationType.SLACK,
        pipelineId: 42,
        pipelineName: 'AnswerToEverything-Pipeline',
        url: 'yo'
      }
      await transformationService.handleNotification(request)

      const expectedObject: SlackCallback = {
        text: `New data available for pipeline ${request.pipelineName}(${request.pipelineId}). ` +
          `Fetch at ${request.dataLocation}.`
      }
      expect(post).toHaveBeenCalledTimes(1)
      expect(post.mock.calls[0][0]).toEqual(request.url)
      expect(post.mock.calls[0][1]).toEqual(expectedObject)
    })
  })
})
