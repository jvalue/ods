import { RequestOptions, ResponseOptions } from '@pact-foundation/pact'
import { eachLike, like } from '@pact-foundation/pact/src/dsl/matchers'
import { JobResult, TransformationRequest } from './transformation'

export const exampleValidTransformationRequest: TransformationRequest = {
  func: 'data.value = 42; return data;',
  data: { }
}

export const exampleSuccessJobResult: JobResult = {
  data: {
    value: 42
  },
  stats: {
    durationInMilliSeconds: 3.14,
    startTimestamp: 123,
    endTimestamp: 456
  }
}

export const exampleTransformationRequestWithInvalidSyntax: TransformationRequest = {
  func: 'n0t v4l1d j4v4$(r1pt',
  data: { }
}

export const exampleInvalidSyntaxJobResult: JobResult = {
  error: {
    name: 'some error',
    message: 'some message',
    lineNumber: 1,
    position: 2,
    stacktrace: []
  },
  stats: {
    durationInMilliSeconds: 3.14,
    startTimestamp: 123,
    endTimestamp: 456
  }
}

export const exampleTransformationRequestWithErrorThrowingFunction: TransformationRequest = {
  func: 'throw new Error()',
  data: { }
}

export const exampleErrorThrownJobResult: JobResult = {
  error: {
    name: 'some error',
    message: 'some message',
    lineNumber: 1,
    position: 2,
    stacktrace: ['some stacktrace entry']
  },
  stats: {
    durationInMilliSeconds: 3.14,
    startTimestamp: 123,
    endTimestamp: 456
  }
}

export function transformDataRequest (body: TransformationRequest): RequestOptions {
  return {
    method: 'POST',
    path: '/job',
    headers: {
      'Content-Type': 'application/json'
    },
    body
  }
}

export const transformDataSuccessResponse: ResponseOptions = {
  // TODO any status code in the range of 200 to 400 is actually acceptable
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: like(exampleSuccessJobResult)
}

export const transformDataInvalidSyntaxResponse: ResponseOptions = {
  // TODO any status code in the range of 200 to 400 is actually acceptable
  status: 400,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: {
    error: {
      name: like(exampleInvalidSyntaxJobResult.error?.name),
      message: like(exampleInvalidSyntaxJobResult.error?.message),
      lineNumber: like(exampleInvalidSyntaxJobResult.error?.lineNumber),
      position: like(exampleInvalidSyntaxJobResult.error?.position),

      // Use exact matching for the stacktrace, because it is expected to be an empty array
      stacktrace: exampleInvalidSyntaxJobResult.error?.stacktrace
    },
    stats: like(exampleInvalidSyntaxJobResult.stats)
  }
}

export const transformDataErrorThrownResponse: ResponseOptions = {
  // TODO any status code in the range of 200 to 400 is actually acceptable
  status: 400,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: like({
    ...exampleErrorThrownJobResult,
    error: {
      ...exampleErrorThrownJobResult.error,
      stacktrace: eachLike(exampleErrorThrownJobResult.error?.stacktrace[0])
    }
  })
}
