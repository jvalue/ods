import { pactWith } from 'jest-pact'
import { PipelineRest } from './pipelineRest'
import {
  createRequest,
  createRequestTitle,
  createSuccessResponse,
  deleteRequest,
  deleteRequestTitle,
  deleteSuccessResponse,
  examplePipeline,
  getAllEmptyResponse,
  getAllRequest,
  getAllRequestTitle,
  getAllSuccessResponse,
  getByDatasourceIdRequest,
  getByDatasourceIdRequestTitle,
  getByDatasourceIdSuccessResponse,
  getByIdRequest,
  getByIdRequestTitle,
  getByIdSuccessResponse,
  updateRequest,
  updateRequestTitle,
  updateSuccessResponse
} from './pipelineRest.consumer.pact.fixtures'
import { badRequestResponse, notFoundResponse, options } from './common.pact.fixtures'

pactWith(options, (provider) => {
  let restService: PipelineRest

  beforeAll(() => {
    const pipelineServiceUrl = provider.mockService.baseUrl
    restService = new PipelineRest(pipelineServiceUrl)
  })

  describe('getting all pipelines', () => {
    describe('when some pipelines exist', () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: 'some pipelines exist',
          uponReceiving: getAllRequestTitle,
          withRequest: getAllRequest,
          willRespondWith: getAllSuccessResponse
        })
      })

      it('returns a non-empty pipeline array', async () => {
        const pipelines = await restService.getAllPipelines()

        expect(pipelines).toStrictEqual([examplePipeline])
      })
    })

    describe('when no pipelines exist', () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: 'no pipelines exist',
          uponReceiving: getAllRequestTitle,
          withRequest: getAllRequest,
          willRespondWith: getAllEmptyResponse
        })
      })

      it('returns an empty pipeline array', async () => {
        const pipelines = await restService.getAllPipelines()

        expect(pipelines).toStrictEqual([])
      })
    })
  })

  describe('getting a pipeline by id', () => {
    describe('when the requested pipeline exists', () => {
      const id = examplePipeline.id

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipeline with id ${id} exists`,
          uponReceiving: getByIdRequestTitle(id),
          withRequest: getByIdRequest(id),
          willRespondWith: getByIdSuccessResponse
        })
      })

      it('returns the requested pipeline', async () => {
        const pipeline = await restService.getPipelineById(id)

        expect(pipeline).toStrictEqual(examplePipeline)
      })
    })

    describe('when the requested pipeline does not exist', () => {
      const id = examplePipeline.id

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipeline with id ${id} does not exist`,
          uponReceiving: getByIdRequestTitle(id),
          withRequest: getByIdRequest(id),
          willRespondWith: notFoundResponse
        })
      })

      it('throws an error', async () => {
        await expect(restService.getPipelineById(id)).rejects.toThrow(Error)
      })
    })

    describe('with NaN as requested id', () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: 'any state',
          uponReceiving: getByIdRequestTitle(NaN),
          withRequest: getByIdRequest(NaN),
          willRespondWith: badRequestResponse
        })
      })

      it('throws an error', async () => {
        await expect(restService.getPipelineById(NaN)).rejects.toThrow(Error)
      })
    })
  })

  // TODO do not skip these tests anymore as soon as issue #353 is solved
  describe.skip('getting a pipeline by datasource id', () => {
    describe('when a pipeline with the requested datasource id exist', () => {
      const id = examplePipeline.datasourceId

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipelines with datasource id ${id} exist`,
          uponReceiving: getByDatasourceIdRequestTitle(id),
          withRequest: getByDatasourceIdRequest(id),
          willRespondWith: getByDatasourceIdSuccessResponse
        })
      })

      it('returns the requested pipeline', async () => {
        const pipeline = await restService.getPipelineByDatasourceId(id)

        expect(pipeline).toStrictEqual(examplePipeline)
      })
    })

    describe('when no pipelines with the requested datasource id exist', () => {
      const id = examplePipeline.datasourceId

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipelines with datasource id ${id} do not exist`,
          uponReceiving: getByDatasourceIdRequestTitle(id),
          withRequest: getByDatasourceIdRequest(id),
          willRespondWith: notFoundResponse
        })
      })

      it('throws an error', async () => {
        await expect(restService.getPipelineByDatasourceId(id)).rejects.toThrow(Error)
      })
    })

    describe('with NaN as requested datasource id', () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: 'any state',
          uponReceiving: getByDatasourceIdRequestTitle(NaN),
          withRequest: getByDatasourceIdRequest(NaN),
          willRespondWith: badRequestResponse
        })
      })

      it('throws an error', async () => {
        await expect(restService.getPipelineByDatasourceId(NaN)).rejects.toThrow(Error)
      })
    })
  })

  describe('creating a pipeline', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'any state',
        uponReceiving: createRequestTitle,
        withRequest: createRequest,
        willRespondWith: createSuccessResponse
      })
    })

    it('returns the created pipeline', async () => {
      const createdPipeline = await restService.createPipeline(examplePipeline)

      const expectedPipeline = {
        ...examplePipeline,
        id: createdPipeline.id
      }
      await expect(createdPipeline).toStrictEqual(expectedPipeline)
    })
  })

  describe('updating a pipeline', () => {
    describe('when the pipeline to update exists', () => {
      const id = examplePipeline.id

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipeline with id ${id} exists`,
          uponReceiving: updateRequestTitle(id),
          withRequest: updateRequest(id),
          willRespondWith: updateSuccessResponse
        })
      })

      it('succeeds', async () => {
        await restService.updatePipeline(examplePipeline)
      })
    })

    describe('when the pipeline to update does not exist', () => {
      const id = examplePipeline.id

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipeline with id ${id} does not exist`,
          uponReceiving: updateRequestTitle(id),
          withRequest: updateRequest(id),
          willRespondWith: notFoundResponse
        })
      })

      it('throws an error', async () => {
        await expect(restService.updatePipeline(examplePipeline)).rejects.toThrow(Error)
      })
    })

    describe('with NaN as id for the pipline to update', () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: 'any state',
          uponReceiving: updateRequestTitle(NaN),
          withRequest: updateRequest(NaN),
          willRespondWith: badRequestResponse
        })
      })

      it('throws an error', async () => {
        const pipelineToUpdate = {
          ...examplePipeline,
          id: NaN
        }
        await expect(restService.updatePipeline(pipelineToUpdate)).rejects.toThrow(Error)
      })
    })
  })

  describe('deleting a pipeline', () => {
    describe('when the pipeline to delete exists', () => {
      const id = examplePipeline.id

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipeline with id ${id} exists`,
          uponReceiving: deleteRequestTitle(id),
          withRequest: deleteRequest(id),
          willRespondWith: deleteSuccessResponse
        })
      })

      it('succeeds', async () => {
        await restService.deletePipeline(id)
      })
    })

    describe('when the pipeline to delete does not exist', () => {
      const id = examplePipeline.id

      beforeEach(async () => {
        await provider.addInteraction({
          state: `pipeline with id ${id} does not exist`,
          uponReceiving: deleteRequestTitle(id),
          withRequest: deleteRequest(id),
          willRespondWith: deleteSuccessResponse
        })
      })

      it('succeeds', async () => {
        await restService.deletePipeline(id)
      })
    })

    describe('with NaN as id for the pipline to update', () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: 'any state',
          uponReceiving: deleteRequestTitle(NaN),
          withRequest: deleteRequest(NaN),
          willRespondWith: badRequestResponse
        })
      })

      it('throws an error', async () => {
        await expect(restService.deletePipeline(NaN)).rejects.toThrow(Error)
      })
    })
  })
})
