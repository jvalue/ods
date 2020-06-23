import { AxiosResponse } from 'axios'
import { createAxios } from '@/keycloak'

import JobResult from './interfaces/jobResult'
import TransformationRequest from './interfaces/transformationRequest'

const TRANSFORMATION_SERVICE_URL = process.env.VUE_APP_TRANSFORMATION_SERVICE_URL as string

export async function transformData (request: TransformationRequest): Promise<JobResult> {
  const http = await createAxios(TRANSFORMATION_SERVICE_URL)

  const response = await http.post('/job', request, {
    validateStatus: status => (status >= 200 && status <= 400)
  }) as AxiosResponse<JobResult>

  return response.data
}
