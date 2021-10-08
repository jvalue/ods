import { RequestOptions, ResponseOptions } from '@pact-foundation/pact';
import { eachLike, like } from '@pact-foundation/pact/src/dsl/matchers';

import {
  JobResult,
  TransformationRequest,
} from './edit/transformation/transformation';
import Pipeline, { HealthStatus, TransformedDataMetaData } from './pipeline';

export const examplePipeline: Pipeline = {
  id: 1,
  datasourceId: 2,
  metadata: {
    author: 'some author',
    description: 'some description',
    displayName: 'some display name',
    license: 'some license',
  },
  transformation: {
    func: 'some function',
  },
};

export const getAllRequestTitle = 'a request for getting all pipelines';
export const getAllRequest: RequestOptions = {
  method: 'GET',
  path: '/configs/',
};

export const getAllEmptyResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: [],
};

export const getAllSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: eachLike(examplePipeline),
};

export function getByIdRequestTitle(id: number): string {
  return `a request for getting the pipeline with id ${id}`;
}

export function getByIdRequest(id: number): RequestOptions {
  return {
    method: 'GET',
    path: `/configs/${id}`,
  };
}

export const getByIdSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: like(examplePipeline),
};

export function getByDatasourceIdRequestTitle(datasourceId: number): string {
  return `a request for getting pipelines with datasource id ${datasourceId}`;
}

export function getByDatasourceIdRequest(datasourceId: number): RequestOptions {
  return {
    method: 'GET',
    path: '/configs/',
    query: `datasourceId=${datasourceId}`,
  };
}

export const getByDatasourceIdSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: eachLike(examplePipeline),
};

export const createRequestTitle = 'a request for creating a pipeline';

export const createRequest: RequestOptions = {
  method: 'POST',
  path: '/configs/',
  headers: {
    'Content-Type': 'application/json',
  },
  body: examplePipeline,
};

export const createSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 201,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: like(examplePipeline),
};

export function updateRequestTitle(id: number): string {
  return `a request for updating the pipeline with id ${id}`;
}

export function updateRequest(id: number): RequestOptions {
  return {
    method: 'PUT',
    path: `/configs/${id}`,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      ...examplePipeline,
      id,
    },
  };
}

export const updateSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 204,
};

export function deleteRequestTitle(id: number): string {
  return `a request for deleting the pipeline with id ${id}`;
}

export function deleteRequest(id: number): RequestOptions {
  return {
    method: 'DELETE',
    path: `/configs/${id}`,
  };
}

export const deleteSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 204,
};

export const exampleTransformedData: TransformedDataMetaData = {
  id: 1,
  healthStatus: HealthStatus.OK,
  timestamp: 'some timestamp', // TODO is this attribute required anywhere?
};

export function getLatestTransformedDataRequestTitle(id: number): string {
  return `a request for getting latest transformed data with id ${id}`;
}

export function getLatestTransformedDataRequest(id: number): RequestOptions {
  return {
    method: 'GET',
    path: `/transdata/${id}/transforms/latest`,
  };
}

export const getLatestTransformedDataSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: like(exampleTransformedData),
};

export const exampleValidTransformationRequest: TransformationRequest = {
  func: 'data.value = 42; return data;',
  data: {},
};

export const exampleSuccessJobResult: JobResult = {
  data: {
    value: 42,
  },
  stats: {
    durationInMilliSeconds: 3.14,
    startTimestamp: 123,
    endTimestamp: 456,
  },
};

export const exampleTransformationRequestWithInvalidSyntax: TransformationRequest = {
  func: 'n0t v4l1d j4v4$(r1pt',
  data: {},
};

export const exampleInvalidSyntaxJobResult: JobResult = {
  error: {
    name: 'some error',
    message: 'some message',
    lineNumber: 1,
    position: 2,
    stacktrace: [],
  },
  stats: {
    durationInMilliSeconds: 3.14,
    startTimestamp: 123,
    endTimestamp: 456,
  },
};

export const exampleTransformationRequestWithErrorThrowingFunction: TransformationRequest = {
  func: 'throw new Error()',
  data: {},
};

export const exampleErrorThrownJobResult: JobResult = {
  error: {
    name: 'some error',
    message: 'some message',
    lineNumber: 1,
    position: 2,
    stacktrace: ['some stacktrace entry'],
  },
  stats: {
    durationInMilliSeconds: 3.14,
    startTimestamp: 123,
    endTimestamp: 456,
  },
};

export function transformDataRequest(
  body: TransformationRequest,
): RequestOptions {
  return {
    method: 'POST',
    path: '/job',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  };
}

export const transformDataSuccessResponse: ResponseOptions = {
  // TODO any status code in the range of 200 to 400 is actually acceptable
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: like(exampleSuccessJobResult),
};

export const transformDataInvalidSyntaxResponse: ResponseOptions = {
  // TODO any status code in the range of 200 to 400 is actually acceptable
  status: 400,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: {
    error: {
      name: like(exampleInvalidSyntaxJobResult.error?.name),
      message: like(exampleInvalidSyntaxJobResult.error?.message),
      lineNumber: like(exampleInvalidSyntaxJobResult.error?.lineNumber),
      position: like(exampleInvalidSyntaxJobResult.error?.position),

      // Use exact matching for the stacktrace, because it is expected to be an empty array
      stacktrace: exampleInvalidSyntaxJobResult.error?.stacktrace,
    },
    stats: like(exampleInvalidSyntaxJobResult.stats),
  },
};

export const transformDataErrorThrownResponse: ResponseOptions = {
  // TODO any status code in the range of 200 to 400 is actually acceptable
  status: 400,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: like({
    ...exampleErrorThrownJobResult,
    error: {
      ...exampleErrorThrownJobResult.error,
      stacktrace: eachLike(exampleErrorThrownJobResult.error?.stacktrace[0]),
    },
  }),
};

export const notFoundResponse: ResponseOptions = {
  // TODO any status code that results in throwing an error is actually acceptable (i.e. 4xx, 5xx)
  status: 404,
};

export const badRequestResponse: ResponseOptions = {
  // TODO any status code that results in throwing an error is actually acceptable (i.e. 4xx, 5xx)
  status: 400,
};
