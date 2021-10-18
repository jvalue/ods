import path from 'path';

import { JestPactOptions, pactWith } from 'jest-pact';

import {
  badRequestResponse,
  exampleStorageItem,
  exampleStorageItemMetaData,
  getStoredItemEmptySuccessResponse,
  getStoredItemRequest,
  getStoredItemRequestTitle,
  getStoredItemSuccessResponse,
  getStoredItemsEmptySuccessResponse,
  getStoredItemsRequest,
  getStoredItemsRequestTitle,
  getStoredItemsSuccessResponse,
  notFoundResponse,
} from './storage.consumer.pact.fixtures';
import { StorageRest } from './storage/storageRest';

const options: JestPactOptions = {
  consumer: 'UI',
  provider: 'Storage',
  dir: path.resolve(process.cwd(), '..', 'pacts'),
  logDir: path.resolve(process.cwd(), '..', 'pacts', 'logs'),
  pactfileWriteMode: 'overwrite',
};

pactWith(options, provider => {
  let restService: StorageRest;

  beforeAll(() => {
    const storageServiceUrl = provider.mockService.baseUrl;
    restService = new StorageRest(storageServiceUrl);
  });

  describe('getting all stored items of a pipeline', () => {
    describe('when the requested pipeline exists and has stored items', () => {
      const id = 1;

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipeline with id ${id} and some stored items exists`,
          uponReceiving: getStoredItemsRequestTitle(id),
          withRequest: getStoredItemsRequest(id),
          willRespondWith: getStoredItemsSuccessResponse,
        });
      });

      it('returns an array containing the stored items', async () => {
        const storedItems = await restService.getStoredItems(id);

        expect(storedItems).toStrictEqual([exampleStorageItemMetaData]);
      });
    });

    describe('when the requested pipeline exists but has no stored items', () => {
      const id = 1;

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipeline with id ${id} and no stored items exists`,
          uponReceiving: getStoredItemsRequestTitle(id),
          withRequest: getStoredItemsRequest(id),
          willRespondWith: getStoredItemsEmptySuccessResponse,
        });
      });

      it('returns an empty array', async () => {
        const storedItems = await restService.getStoredItems(id);

        expect(storedItems).toStrictEqual([]);
      });
    });

    describe('when the requested pipeline does not exist', () => {
      const id = 1;

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipeline with id ${id} does not exist`,
          uponReceiving: getStoredItemsRequestTitle(id),
          withRequest: getStoredItemsRequest(id),
          willRespondWith: notFoundResponse,
        });
      });

      it('throws an error', async () => {
        await expect(restService.getStoredItems(id)).rejects.toThrow(Error);
      });
    });

    describe('with NaN as requested id', () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: 'any state',
          uponReceiving: getStoredItemsRequestTitle(NaN),
          withRequest: getStoredItemsRequest(NaN),
          willRespondWith: notFoundResponse,
        });
      });

      it('throws an error', async () => {
        await expect(restService.getStoredItems(NaN)).rejects.toThrow(Error);
      });
    });
  });

  describe('getting a stored item of a pipeline', () => {
    describe('when the requested pipeline exists and has the stored item', () => {
      const pipelineId = 1;
      const storageItemId = 2;

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipeline with id ${pipelineId} and a stored item with id ${storageItemId} exists`,
          uponReceiving: getStoredItemRequestTitle(pipelineId, storageItemId),
          withRequest: getStoredItemRequest(pipelineId, storageItemId),
          willRespondWith: getStoredItemSuccessResponse,
        });
      });

      it('returns the requested stored item', async () => {
        const item = await restService.getStoredItem(pipelineId, storageItemId);

        expect(item).toStrictEqual(exampleStorageItem);
      });
    });

    describe('when the requested pipeline exists but does not have the stored item', () => {
      const pipelineId = 1;
      const storageItemId = 2;

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipeline with id ${pipelineId} and no stored items exists`,
          uponReceiving: getStoredItemRequestTitle(pipelineId, storageItemId),
          withRequest: getStoredItemRequest(pipelineId, storageItemId),
          willRespondWith: getStoredItemEmptySuccessResponse,
        });
      });

      it('returns null', async () => {
        const item = await restService.getStoredItem(pipelineId, storageItemId);

        expect(item).toBeNull();
      });
    });

    describe('with NaN as storage item id', () => {
      const pipelineId = 1;

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipeline with id ${pipelineId} and no stored items exists`,
          uponReceiving: getStoredItemRequestTitle(pipelineId, NaN),
          withRequest: getStoredItemRequest(pipelineId, NaN),
          willRespondWith: badRequestResponse,
        });
      });

      it('throws an error', async () => {
        await expect(
          restService.getStoredItem(pipelineId, NaN),
        ).rejects.toThrow(Error);
      });
    });

    describe('when the requested pipeline does not exist', () => {
      const pipelineId = 1;
      const storageItemId = 2;

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipeline with id ${pipelineId} does not exist`,
          uponReceiving: getStoredItemRequestTitle(pipelineId, storageItemId),
          withRequest: getStoredItemRequest(pipelineId, storageItemId),
          willRespondWith: notFoundResponse,
        });
      });

      it('throws an error', async () => {
        await expect(
          restService.getStoredItem(pipelineId, storageItemId),
        ).rejects.toThrow(Error);
      });
    });

    describe('with NaN as requested pipeline id', () => {
      const storageItemId = 2;

      beforeEach(async () => {
        await provider.addInteraction({
          state: 'any state',
          uponReceiving: getStoredItemRequestTitle(NaN, storageItemId),
          withRequest: getStoredItemRequest(NaN, storageItemId),
          willRespondWith: notFoundResponse,
        });
      });

      it('throws an error', async () => {
        await expect(
          restService.getStoredItem(NaN, storageItemId),
        ).rejects.toThrow(Error);
      });
    });
  });
});
