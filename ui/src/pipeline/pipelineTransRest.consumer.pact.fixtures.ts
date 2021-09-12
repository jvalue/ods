import { HealthStatus } from '@/datasource/datasource'
import { RequestOptions, ResponseOptions } from '@pact-foundation/pact'
import { like } from '@pact-foundation/pact/src/dsl/matchers'
import { TransformedDataMetaData } from './pipeline'

export const exampleTransformedData: TransformedDataMetaData = {
  id: 1,
  healthStatus: HealthStatus.OK,
  timestamp: 'some timestamp' // TODO is this attribute required anywhere?
}

export function getLatestTransformedDataRequestTitle (id: number): string {
  return `a request for getting latest transformed data with id ${id}`
}

export function getLatestTransformedDataRequest (id: number): RequestOptions {
  return {
    method: 'GET',
    path: `/transdata/${id}/transforms/latest`
  }
}

export const getLatestTransformedDataSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: like(exampleTransformedData)
}
