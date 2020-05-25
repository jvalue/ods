/* eslint-env jest */
import axios from 'axios'

import TransformationService from './interfaces/transformationService'

import JSTransformationService from './jsTransformationService'
import VM2SandboxExecutor from './vm2SandboxExecutor'
import SandboxExecutor from './interfaces/sandboxExecutor'

jest.mock('axios')

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
})
