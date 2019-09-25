/* eslint-env jest */
import { execute, evaluate } from './sandbox'

test('execute very simple literal return', () => {
  const result = execute('return 1;', {})
  expect(result).toEqual('1')
})

test('execute very simple object return', () => {
  const result = execute('return {};', {})
  expect(result).toEqual('{}')
})

test('execute data return', () => {
  const object = { exampleKey: 'value1', anotherKey: 123 }
  const result = execute('return data;', object)
  expect(result).toEqual(JSON.stringify(object))
})

test('execute data simple modification', () => {
  const object = { exampleKey: 'value1', anotherKey: 123 }
  const result = execute('data.exampleKey = "otherValue";\nreturn data;', object)
  const newObject = { ...object }
  newObject.exampleKey = 'otherValue'
  expect(result).toEqual(JSON.stringify(newObject))
})

test('evaluate simple true expression', () => {
  const object = { value1: 5 }
  const expression = 'data.value1 === 5'

  const result = evaluate(expression, object)

  expect(result).toBeTruthy()
})

test('evaluate simple false expression', () => {
  const object = { value1: 5 }
  const expression = 'data.value1 === 6'

  const result = evaluate(expression, object)

  expect(result).toBeFalsy()
})

test('evaluate nonboolean expression', () => {
  const object = { value1: 5 }
  const expression = '1 + 1'

  const result = evaluate(expression, object)

  expect(result).toBeFalsy()
})

test('evaluate complex expression', () => {
  const object = { value1: 5, value2: 10, stringval: 'text' }
  const expression = 'data.value1 + data.value2 === 15 && data.stringval === "text"'

  const result = evaluate(expression, object)

  expect(result).toBeTruthy()
})
