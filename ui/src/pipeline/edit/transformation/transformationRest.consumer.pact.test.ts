import { pactWith } from 'jest-pact'
import { options } from '../../common.pact.fixtures'
import { TransformationRest } from './transformationRest'
import {
  exampleErrorThrownJobResult,
  exampleInvalidSyntaxJobResult,
  exampleSuccessJobResult,
  exampleTransformationRequestWithErrorThrowingFunction,
  exampleTransformationRequestWithInvalidSyntax,
  exampleValidTransformationRequest,
  transformDataErrorThrownResponse,
  transformDataInvalidSyntaxResponse,
  transformDataRequest,
  transformDataSuccessResponse
} from './transformationRest.consumer.pact.fixtures'

pactWith(options, (provider) => {
  let restService: TransformationRest

  beforeAll(() => {
    const pipelineServiceUrl = provider.mockService.baseUrl
    restService = new TransformationRest(pipelineServiceUrl)
  })

  describe('transforming data', () => {
    describe('when the transformation request is valid', () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: 'any state',
          uponReceiving: 'a valid request for transforming data',
          withRequest: transformDataRequest(exampleValidTransformationRequest),
          willRespondWith: transformDataSuccessResponse
        })
      })

      it('returns a job result that contains no error', async () => {
        const jobResult = await restService.transformData(exampleValidTransformationRequest)

        expect(jobResult).toStrictEqual(exampleSuccessJobResult)
      })
    })

    describe('when the function of the transformation request has invalid syntax', () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: 'any state',
          uponReceiving: 'an request for transforming data whose function has invalid syntax',
          withRequest: transformDataRequest(exampleTransformationRequestWithInvalidSyntax),
          willRespondWith: transformDataInvalidSyntaxResponse
        })
      })

      it('returns a job result that contains an error with empty stacktrace', async () => {
        const jobResult = await restService.transformData(exampleTransformationRequestWithInvalidSyntax)

        expect(jobResult).toStrictEqual(exampleInvalidSyntaxJobResult)
      })
    })

    describe('when the function of the transformation request throws an error', () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: 'any state',
          uponReceiving: 'an request for transforming data whose function throws an error',
          withRequest: transformDataRequest(exampleTransformationRequestWithErrorThrowingFunction),
          willRespondWith: transformDataErrorThrownResponse
        })
      })

      it('returns a job result that contains an error with nonempty stacktrace', async () => {
        const jobResult = await restService.transformData(exampleTransformationRequestWithErrorThrowingFunction)

        expect(jobResult).toStrictEqual(exampleErrorThrownJobResult)
      })
    })
  })
})
