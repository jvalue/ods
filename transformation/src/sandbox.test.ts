/* eslint-env jest */
import { execute } from './sandbox'

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
