import { RequestOptions, ResponseOptions } from '@pact-foundation/pact'
import { eachLike, like } from '@pact-foundation/pact/src/dsl/matchers'
import Pipeline from './pipeline'

export const examplePipeline: Pipeline = {
  id: 1,
  datasourceId: 2,
  metadata: {
    author: 'some author',
    description: 'some description',
    displayName: 'some display name',
    license: 'some license'
  },
  transformation: {
    func: 'some function'
  }
}

export const getAllRequestTitle = 'a request for getting all pipelines'
export const getAllRequest: RequestOptions = {
  method: 'GET',
  path: '/configs/'
}

export const getAllEmptyResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: []
}

export const getAllSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: eachLike(examplePipeline)
}

export function getByIdRequestTitle (id: number): string {
  return `a request for getting the pipeline with id ${id}`
}

export function getByIdRequest (id: number): RequestOptions {
  return {
    method: 'GET',
    path: `/configs/${id}`
  }
}

export const getByIdSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: like(examplePipeline)
}

export function getByDatasourceIdRequestTitle (datasourceId: number): string {
  return `a request for getting pipelines with datasource id ${datasourceId}`
}

export function getByDatasourceIdRequest (datasourceId: number): RequestOptions {
  return {
    method: 'GET',
    path: '/configs/',
    query: `datasourceId=${datasourceId}`
  }
}

export const getByDatasourceIdSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: like(examplePipeline)
}

export const createRequestTitle = 'a request for creating a pipeline'

export const createRequest: RequestOptions = {
  method: 'POST',
  path: '/configs/',
  headers: {
    'Content-Type': 'application/json'
  },
  body: examplePipeline
}

export const createSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 201,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: like(examplePipeline)
}

export function updateRequestTitle (id: number): string {
  return `a request for updating the pipeline with id ${id}`
}

export function updateRequest (id: number): RequestOptions {
  return {
    method: 'PUT',
    path: `/configs/${id}`,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      ...examplePipeline,
      id
    }
  }
}

export const updateSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 204
}

export function deleteRequestTitle (id: number): string {
  return `a request for deleting the pipeline with id ${id}`
}

export function deleteRequest (id: number): RequestOptions {
  return {
    method: 'DELETE',
    path: `/configs/${id}`
  }
}

export const deleteSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 204
}
