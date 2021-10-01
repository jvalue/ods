import axios, { AxiosInstance } from 'axios'

import { TransformationRequest, JobResult } from './transformation'

export class TransformationRest {
  private readonly http: AxiosInstance

  constructor (pipelineServiceUrl: string) {
    this.http = axios.create({
      baseURL: pipelineServiceUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  async transformData (request: TransformationRequest): Promise<JobResult> {
    const response = await this.http.post('/job', request, {
      validateStatus: status => (status >= 200 && status <= 400)
    })

    return response.data
  }
}
