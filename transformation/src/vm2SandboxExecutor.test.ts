/* eslint-env jest */
import SandboxExecutor from './interfaces/sandboxExecutor'
import VM2SandboxExecutor from './vm2SandboxExecutor'

describe('VM2SandboxExecutor', () => {
  let e: SandboxExecutor

  beforeEach(() => {
    e = new VM2SandboxExecutor(1000)
  })

  describe('execute', () => {
    it('should execute very simple literal return', () => {
      const { data: result, error } = e.execute('return 1;', {})
      expect(result).toEqual(1)
      expect(error).toBe(undefined)
    })

    it('should execute very simple object return', () => {
      const { data: result, error } = e.execute('return {};', {})
      expect(result).toEqual({})
      expect(error).toBe(undefined)
    })

    it('should execute data return', () => {
      const object = { exampleKey: 'value1', anotherKey: 123 }
      const { data: result, error } = e.execute('return data;', object)
      expect(result).toEqual(object)
      expect(error).toBe(undefined)
    })

    it('should execute data simple modification', () => {
      const object = { exampleKey: 'value1', anotherKey: 123 }
      const { data: result, error } = e.execute('data.exampleKey = "otherValue";\nreturn data;', object)
      const newObject = { ...object }
      newObject.exampleKey = 'otherValue'
      expect(result).toEqual(newObject)
      expect(error).toBe(undefined)
    })

    it('should throw syntax errors: unexpected identifier', () => {
      const { data: result, error } = e.execute('syntax error', {})
      expect(result).toEqual(undefined)
      if (error === undefined) {
        fail()
        return
      }
      expect(error.name).toBe('SyntaxError')
      expect(error.lineNumber).toBe(1)
      expect(error.position).toBe(7)
    })

    it('should throw syntax errors: missing bracket', () => {
      const { data: result, error } = e.execute('c = Math.max(a', {})
      expect(result).toEqual(undefined)
      if (error === undefined) {
        fail()
        return
      }
      expect(error.name).toBe('SyntaxError')
      expect(error.lineNumber).toBe(1)
      expect(error.position).toBe(13)
    })

    it('should throw reference errors', () => {
      const { data: result, error } = e.execute('return somethingThatIsntThere;', {})
      expect(result).toEqual(undefined)
      if (error === undefined) {
        fail()
        return
      }
      expect(error.name).toBe('ReferenceError')
      expect(error.lineNumber).toBe(1)
      expect(error.position).toBe(1)
    })

    it('should throw type errors with rewritten stacktrace', () => {
      const { data: result, error } = e.execute(`
function test(data) {
  data.d.e = 0;
}
return test(data);`, {})
      expect(result).toEqual(undefined)
      if (error === undefined) {
        fail()
        return
      }
      expect(error.name).toBe('TypeError')
      expect(error.stacktrace[0]).toBe('    at test (main:3:12)')
      expect(error.stacktrace[1]).toBe('    at main (main:5:8)')
    })

    it('should timeout on a while(true) loop', () => {
      const { data, error } = e.execute('while(true) {}\nreturn data;', {})
      expect(data).toEqual(undefined)
      if (error === undefined) {
        fail()
        return
      }
      expect(error.name).toBe('TimeoutError')
      expect(error.lineNumber).toBe(0)
      expect(error.position).toBe(0)
    })

    it('should not be possible to require things', () => {
      const { data, error } = e.execute(`
        const fs = require('fs');
        fs.stat('/tmp/something', () => {});
        return data;`,
      { a: 1 })
      expect(data).toEqual(undefined)
      if (error === undefined) {
        fail()
        return
      }
      expect(error.name).toBe('ReferenceError')
      expect(error.message).toBe('ReferenceError: require is not defined')
    })

    it('no access to process', () => {
      const { data, error } = e.execute(`
        process.exit(0);`,
      { a: 1 })
      expect(data).toEqual(undefined)
      if (error === undefined) {
        fail()
        return
      }
      expect(error.name).toBe('ReferenceError')
      expect(error.message).toBe('ReferenceError: process is not defined')
    })

    it('no breakout using console', () => {
      const result = e.execute('console.constructor.constructor(\'return process\')(); return data;', { a: 1 })
      const { data, error } = result
      expect(data).toEqual(undefined)
      if (error === undefined) {
        fail()
        return
      }
      expect(error.name).toBe('ReferenceError')
      expect(error.message).toBe('ReferenceError: process is not defined')
    })
  })
})
