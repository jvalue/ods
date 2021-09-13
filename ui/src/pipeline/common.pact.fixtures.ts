import { ResponseOptions } from '@pact-foundation/pact'
import { JestPactOptions } from 'jest-pact'
import path from 'path'

export const options: JestPactOptions = {
  consumer: 'UI',
  provider: 'Pipeline',
  dir: path.resolve(process.cwd(), '..', 'pacts'),
  logDir: path.resolve(process.cwd(), '..', 'pacts', 'logs'),
  pactfileWriteMode: 'overwrite'
}

export const notFoundResponse: ResponseOptions = {
  // TODO any status code that results in throwing an error is actually acceptable (i.e. 4xx, 5xx)
  status: 404
}

export const badRequestResponse: ResponseOptions = {
  // TODO any status code that results in throwing an error is actually acceptable (i.e. 4xx, 5xx)
  status: 400
}
