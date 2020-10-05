/* eslint-env jest */
import SandboxExecutor from './sandboxExecutor'
import VM2SandboxExecutor from './vm2SandboxExecutor'
import { ExecutionResult } from './executionResult'

describe('VM2SandboxExecutor', () => {
  let e: SandboxExecutor

  beforeEach(() => {
    e = new VM2SandboxExecutor(1000)
  })

  const expectSuccessfulResult = (result: ExecutionResult, dataExpected: unknown): void => {
    expect(result).toHaveProperty('data', dataExpected)
    expect(result).not.toHaveProperty('error')
  }

  describe('execute', () => {
    it('should execute very simple literal return', () => {
      const result = e.execute('return 1;', {})
      expectSuccessfulResult(result, 1)
    })

    it('should execute very simple object return', () => {
      const result = e.execute('return {};', {})
      expectSuccessfulResult(result, {})
    })

    it('should execute data return', () => {
      const object = { exampleKey: 'value1', anotherKey: 123 }
      const result = e.execute('return data;', object)
      expectSuccessfulResult(result, object)
    })

    it('should execute data simple modification', () => {
      const object = { exampleKey: 'value1', anotherKey: 123 }
      const result = e.execute('data.exampleKey = "otherValue";\nreturn data;', object)
      expectSuccessfulResult(result, { ...object, exampleKey: 'otherValue' })
    })

    it('should throw syntax errors: unexpected identifier', () => {
      const result = e.execute('syntax error', {})
      expect(result).not.toHaveProperty('data')
      expect(result).toHaveProperty('error')
      if ('data' in result) {
        return
      }
      expect(result.error.name).toBe('SyntaxError')
      expect(result.error.lineNumber).toBe(1)
      expect(result.error.position).toBe(7)
    })

    it('should throw syntax errors: missing bracket', () => {
      const result = e.execute('c = Math.max(a', {})
      expect(result).not.toHaveProperty('data')
      expect(result).toHaveProperty('error')
      if ('data' in result) {
        return
      }
      expect(result.error.name).toBe('SyntaxError')
      expect(result.error.lineNumber).toBe(1)
      expect(result.error.position).toBe(13)
    })

    it('should throw reference errors', () => {
      const result = e.execute('return somethingThatIsntThere;', {})
      expect(result).not.toHaveProperty('data')
      expect(result).toHaveProperty('error')
      if ('data' in result) {
        return
      }
      expect(result.error.name).toBe('ReferenceError')
      expect(result.error.lineNumber).toBe(1)
      expect(result.error.position).toBe(1)
    })

    it('should throw type errors with rewritten stacktrace', () => {
      const result = e.execute(`
function test(data) {
  data.d.e = 0;
}
return test(data);`, {})
      expect(result).not.toHaveProperty('data')
      expect(result).toHaveProperty('error')
      if ('data' in result) {
        return
      }
      expect(result.error.name).toBe('TypeError')
      expect(result.error.stacktrace[0]).toBe('    at test (main:3:12)')
      expect(result.error.stacktrace[1]).toBe('    at main (main:5:8)')
    })

    it('should timeout on a while(true) loop', () => {
      const result = e.execute('while(true) {}\nreturn data;', {})
      expect(result).not.toHaveProperty('data')
      expect(result).toHaveProperty('error')
      if ('data' in result) {
        return
      }
      expect(result.error.name).toBe('TimeoutError')
      expect(result.error.lineNumber).toBe(0)
      expect(result.error.position).toBe(0)
    })

    it('should not be possible to require things', () => {
      const result = e.execute(`
        const fs = require('fs');
        fs.stat('/tmp/something', () => {});
        return data;`, { a: 1 })
      expect(result).not.toHaveProperty('data')
      expect(result).toHaveProperty('error')
      if ('data' in result) {
        return
      }
      expect(result.error.name).toBe('ReferenceError')
      expect(result.error.message).toBe('ReferenceError: require is not defined')
    })

    it('no access to process', () => {
      const result = e.execute(`
        process.exit(0);`, { a: 1 })
      expect(result).not.toHaveProperty('data')
      expect(result).toHaveProperty('error')
      if ('data' in result) {
        return
      }
      expect(result.error.name).toBe('ReferenceError')
      expect(result.error.message).toBe('ReferenceError: process is not defined')
    })

    it('no breakout using console', () => {
      const result = e.execute('console.constructor.constructor(\'return process\')(); return data;', { a: 1 })
      expect(result).not.toHaveProperty('data')
      expect(result).toHaveProperty('error')
      if ('data' in result) {
        return
      }
      expect(result.error.name).toBe('ReferenceError')
      expect(result.error.message).toBe('ReferenceError: process is not defined')
    })
  })
})
