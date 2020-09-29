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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        execute: jest.fn((func, data) => ({ data: {}, error: undefined }))
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
    let pipelineExecutor: PipelineExecutor
    let sandboxExecutorMock: jest.Mocked<SandboxExecutor>

    beforeEach(() => {
      const SandboxMock = jest.fn(() => ({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        execute: jest.fn((func, data) => ({ data: undefined, error: undefined })),
        evaluate: jest.fn()
      }))
      sandboxExecutorMock = new SandboxMock()
      pipelineExecutor = new PipelineExecutor(sandboxExecutorMock)
    })

    it('should return an error if no return clause is included', () => {
      const jobResult = pipelineExecutor.executeJob('data.a = 1;', { a: 2 })
      expect(jobResult.data).toBeUndefined()
      if (jobResult.error === undefined) {
        throw new Error('Fail test')
      }
      expect(jobResult.error.name).toBe('MissingReturnError')
    })
  })
})
