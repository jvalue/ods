import { pactWith } from 'jest-pact'
import { badRequestResponse, notFoundResponse, options } from './common.pact.fixtures'
import { PipelineTransRest } from './pipelineTransRest'
import {
  exampleTransformedData,
  getLatestTransformedDataRequest,
  getLatestTransformedDataRequestTitle,
  getLatestTransformedDataSuccessResponse
} from './pipelineTransRest.consumer.pact.fixtures'

pactWith(options, (provider) => {
  let restService: PipelineTransRest

  beforeAll(() => {
    const pipelineServiceUrl = provider.mockService.baseUrl
    restService = new PipelineTransRest(pipelineServiceUrl)
  })

  describe('getting latest transformed data', () => {
    describe('when the requested transformed data exists', () => {
      const id = exampleTransformedData.id

      beforeEach(async () => {
        await provider.addInteraction({
          state: `transformed data with id ${id} exists`,
          uponReceiving: getLatestTransformedDataRequestTitle(id),
          withRequest: getLatestTransformedDataRequest(id),
          willRespondWith: getLatestTransformedDataSuccessResponse
        })
      })

      it('returns the requested transformed data', async () => {
        const transformedData = await restService.getLatestTransformedData(id)

        expect(transformedData).toStrictEqual(exampleTransformedData)
      })
    })

    describe('when the requested transformed data does not exist', () => {
      const id = exampleTransformedData.id

      beforeEach(async () => {
        await provider.addInteraction({
          state: `transformed data with id ${id} does not exist`,
          uponReceiving: getLatestTransformedDataRequestTitle(id),
          withRequest: getLatestTransformedDataRequest(id),
          willRespondWith: notFoundResponse
        })
      })

      it('throws an error', async () => {
        await expect(restService.getLatestTransformedData(id)).rejects.toThrow(Error)
      })
    })

    describe('with NaN as requested id', () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: 'any state',
          uponReceiving: getLatestTransformedDataRequestTitle(NaN),
          withRequest: getLatestTransformedDataRequest(NaN),
          willRespondWith: badRequestResponse
        })
      })

      it('throws an error', async () => {
        await expect(restService.getLatestTransformedData(NaN)).rejects.toThrow(Error)
      })
    })
  })
})
