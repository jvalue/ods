import { RequestOptions, ResponseOptions } from '@pact-foundation/pact'
import { JestPactOptions, pactWith } from 'jest-pact'
import { PipelineRest } from './pipelineRest'
import Pipeline from './pipeline'
import path from 'path'

const options: JestPactOptions = {
  consumer: 'UI',
  provider: 'Pipeline',
  dir: path.resolve(process.cwd(), '..', 'pacts'),
  logDir: path.resolve(process.cwd(), '..', 'pacts', 'logs'),
  pactfileWriteMode: 'overwrite'
}

const request: RequestOptions = {
  method: 'GET',
  path: '/configs/'
}

const response: ResponseOptions = {
  status: 200,
  body: []
}

pactWith(options, (provider) => {
  describe('Pipeline Config Endpoint', () => {
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
      const pipelines: Pipeline[] = await restService.getAllPipelines()

      expect(pipelines.length === 0)
    })
  })
})
