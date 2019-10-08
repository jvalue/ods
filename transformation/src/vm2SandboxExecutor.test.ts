/* eslint-env jest */
import SandboxExecutor from './interfaces/sandboxExecutor'
import VM2SandboxExecutor from './vm2SandboxExecutor'

/**
 * Checks if the supplied object is of type name.
 * This method uses the constructor name for this check in order to also work across contexts.
 * @param object The object to be checked
 * @param name The name of the type to check against, e.g. 'SyntaxError'
 */
function isInstance (object: any, name: string): boolean {
  return (object.constructor.name) === name
}

describe('VM2SandboxExecutor', () => {
  let e: SandboxExecutor

  beforeEach(() => {
    e = new VM2SandboxExecutor()
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

    it('should throw syntax errors', () => {
      const { data: result, error } = e.execute('syntax error', {})
      expect(result).toEqual(undefined)
      expect(isInstance(error, 'SyntaxError')).toBe(true)
    })

    it('should throw reference errors', () => {
      const { data: result, error } = e.execute('return somethingThatIsntThere;', {})
      expect(result).toEqual(undefined)
      expect(isInstance(error, 'ReferenceError')).toBe(true)
    })
  })

  describe('evaluate', () => {
    it('should evaluate simple true expression', () => {
      const object = { value1: 5 }
      const expression = 'data.value1 === 5'

      const result = e.evaluate(expression, object)

      expect(result).toBe(true)
    })

    it('should evaluate simple false expression', () => {
      const object = { value1: 5 }
      const expression = 'data.value1 === 6'

      const result = e.evaluate(expression, object)

      expect(result).toBe(false)
    })

    it('should evaluate nonboolean expression', () => {
      const object = { value1: 5 }
      const expression = '1 + 1'

      const result = e.evaluate(expression, object)

      expect(result).toBe(false)
    })

    it('should evaluate complex expression', () => {
      const object = { value1: 5, value2: 10, stringval: 'text' }
      const expression = 'data.value1 + data.value2 === 15 && data.stringval === "text"'

      const result = e.evaluate(expression, object)

      expect(result).toBe(true)
    })
  })
})
