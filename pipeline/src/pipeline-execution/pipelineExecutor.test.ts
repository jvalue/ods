/* eslint-env jest */
import PipelineExecutor from './pipelineExecutor'
import SandboxExecutor from './sandbox/sandboxExecutor'

jest.mock('axios')

describe('PipelineExecutor', () => {
  describe('valid execution', () => {
    let pipelineExecutor: PipelineExecutor
    let sandboxExecutorMock: jest.Mocked<SandboxExecutor>

    beforeEach(() => {
      const SandboxMock = jest.fn(() => ({
        execute: jest.fn((func, data) => ({ data: {} }))
      }))
      sandboxExecutorMock = new SandboxMock()
      pipelineExecutor = new PipelineExecutor(sandboxExecutorMock)
    })

    it('should call execute on the sandbox', () => {
      pipelineExecutor.executeJob('return 1;', {})
      expect(sandboxExecutorMock.execute).toHaveBeenCalled()
    })

    it('should return an object with stats', () => {
      const jobResult = pipelineExecutor.executeJob('return 1;', {})
      expect(jobResult.stats.durationInMilliSeconds).toBeGreaterThan(0)
      expect(jobResult.stats.endTimestamp).toBeGreaterThanOrEqual(jobResult.stats.startTimestamp)
    })
  })

  describe('invalid execution', () => {
    let transformationService: PipelineExecutor
    let sandboxExecutorMock: SandboxExecutor

    beforeEach(() => {
      sandboxExecutorMock = { execute: (code, data) => ({ data: null }) }
      transformationService = new PipelineExecutor(sandboxExecutorMock)
    })

    it('should return an error if no return clause is included', () => {
      const jobResult = transformationService.executeJob('data.a = 1;', { a: 2 })
      expect(jobResult).not.toHaveProperty('data')
      expect(jobResult).toHaveProperty('error')
      if ('data' in jobResult) {
        return
      }
      expect(jobResult.error.name).toBe('MissingReturnError')
    })
  })
})
