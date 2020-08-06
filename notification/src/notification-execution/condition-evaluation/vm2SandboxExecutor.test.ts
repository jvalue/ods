/* eslint-env jest */
import SandboxExecutor from './sandboxExecutor'
import VM2SandboxExecutor from './vm2SandboxExecutor'

describe('VM2SandboxExecutor', () => {
  let e: SandboxExecutor

  beforeEach(() => {
    e = new VM2SandboxExecutor(1000)
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

    it('should error on nonboolean expression', () => {
      const object = { value1: 5 }
      const expression = '1 + 1'

      try {
        e.evaluate(expression, object)
        throw new Error('Fail test')
      } catch (err) {
        expect(err.message).toEqual(
          'Malformed expression received: 1 + 1\n Error message: ' +
          'Expected result to be a boolean expression!'
        )
      }
    })

    it('should evaluate complex expression', () => {
      const object = { value1: 5, value2: 10, stringval: 'text' }
      const expression = 'data.value1 + data.value2 === 15 && data.stringval === "text"'

      const result = e.evaluate(expression, object)

      expect(result).toBe(true)
    })

    it('should evaluate expression "data === undefined" on undefined data', () => {
      const object = undefined
      const expression = 'data === undefined'

      const result = e.evaluate(expression, object)

      expect(result).toBe(true)
    })

    it('should evaluate expression "data === undefined" on undefined data', () => {
      const object = undefined
      const expression = '!data'

      const result = e.evaluate(expression, object)

      expect(result).toBe(true)
    })
  })
})
