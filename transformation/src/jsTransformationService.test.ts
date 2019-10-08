/* eslint-env jest */
import axios from 'axios'

import { NotificationRequest, NotificationType } from './interfaces/notificationRequest'
import TransformationService from './interfaces/transformationService'

import JSTransformationService from './jsTransformationService'
import VM2SandboxExecutor from './vm2SandboxExecutor'
import SandboxExecutor from './interfaces/sandboxExecutor'

jest.mock('axios')

describe('JSTransformationService', () => {
  describe('execution', () => {
    let transformationService: TransformationService
    let sandboxExecutorMock: jest.Mocked<SandboxExecutor>

    beforeEach(() => {
      const SandboxMock = jest.fn(() => ({
        execute: jest.fn(),
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
      expect(jobResult.stats.executionTime).toBeGreaterThan(0)
      console.log(jobResult)
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
        callbackUrl: 'callback',
        dataLocation: 'data',
        data: data,
        condition: 'data.value1 > 0',
        type: NotificationType.WEBHOOK
      }

      await transformationService.handleNotification(notificationRequest)

      expect(post).toHaveBeenCalledTimes(1)
      // check arguments for axios post
      expect(post.mock.calls[0][0]).toEqual(notificationRequest.callbackUrl)
      expect(post.mock.calls[0][1].location).toEqual(notificationRequest.dataLocation)
    })

    test('Notification does not trigger when condition is not met', async () => {
      const notificationRequest: NotificationRequest = {
        callbackUrl: 'callback',
        dataLocation: 'data',
        data: data,
        condition: 'data.value1 < 0',
        type: NotificationType.WEBHOOK
      }

      await transformationService.handleNotification(notificationRequest)

      expect(post).not.toHaveBeenCalled()
    })

    test('Notification does not trigger when condition is malformed', async () => {
      const notificationRequest: NotificationRequest = {
        callbackUrl: 'callback',
        dataLocation: 'data',
        data: data,
        condition: 'asdfa;',
        type: NotificationType.WEBHOOK
      }

      await transformationService.handleNotification(notificationRequest)

      expect(post).not.toHaveBeenCalled()
    })
  })
})
