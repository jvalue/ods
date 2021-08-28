import { RequestOptions, ResponseOptions } from '@pact-foundation/pact'
import { JestPactOptions, pactWith } from 'jest-pact'
import { PipelineRest } from './pipelineRest'
import Pipeline from './pipeline'

const options : JestPactOptions = {
    consumer: 'UI',
    provider: 'Pipeline'
}

const request : RequestOptions = {
    method: 'GET',
    path: '/configs/'
}

const response : ResponseOptions = {
    status: 200,
    body: []
}

pactWith(options, async (provider) => {

    describe("Pipeline Config Endpoint", () => {

        beforeEach(async () => {
            await provider.addInteraction({
                state: 'no pipelines registered',
                uponReceiving: 'a request for getting all pipelines',
                withRequest: request,
                willRespondWith: response
            })
        })

        it('returns an empty pipeline array', async () => {
            const pipelineServiceUrl = provider.mockService.baseUrl
            const restService = new PipelineRest(pipelineServiceUrl)
            const pipelines : Pipeline[] = await restService.getAllPipelines()

            expect(pipelines.length == 0)
        })
    })
})