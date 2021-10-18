import { RequestOptions, ResponseOptions } from '@pact-foundation/pact';
import { eachLike } from '@pact-foundation/pact/src/dsl/matchers';

import { StorageItem, StorageItemMetaData } from './storage/storage-item';

export const exampleStorageItemMetaData: StorageItemMetaData = {
  id: 2,
  timestamp: 'some date',
  pipelineId: 1,
};

export const exampleStorageItem: StorageItem = {
  ...exampleStorageItemMetaData,
  data: {},
};

export function getStoredItemsRequestTitle(pipelineId: number): string {
  return `a request for getting all stored items of the pipeline with id ${pipelineId}`;
}

export function getStoredItemsRequest(pipelineId: number): RequestOptions {
  return {
    method: 'GET',
    path: `/${pipelineId}`,
    query: 'select=id,timestamp,pipelineId',
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

export const getStoredItemsSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: eachLike(exampleStorageItemMetaData),
};

export const getStoredItemsEmptySuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: [],
};

export function getStoredItemRequestTitle(
  pipelineId: number,
  storageItemId: number,
): string {
  return `a request for getting the stored item with id ${storageItemId} of the pipeline with id ${pipelineId}`;
}

export function getStoredItemRequest(
  pipelineId: number,
  storageItemId: number,
): RequestOptions {
  return {
    method: 'GET',
    path: `/${pipelineId}`,
    query: `id=eq.${storageItemId}`,
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

export const getStoredItemSuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: eachLike(exampleStorageItem),
};

export const getStoredItemEmptySuccessResponse: ResponseOptions = {
  // TODO any success status code is actually acceptable (i.e. 2xx)
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: [],
};

export const notFoundResponse: ResponseOptions = {
  // TODO any status code that results in throwing an error is actually acceptable (i.e. 4xx, 5xx)
  status: 404,
};

export const badRequestResponse: ResponseOptions = {
  // TODO any status code that results in throwing an error is actually acceptable (i.e. 4xx, 5xx)
  status: 400,
};
