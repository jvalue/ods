import axios, { AxiosResponse } from 'axios'

import { TransformationRequest, JobResult } from './transformation'

const TRANSFORMATION_SERVICE_URL = process.env.VUE_APP_TRANSFORMATION_SERVICE_URL as string

const http = axios.create({
  baseURL: TRANSFORMATION_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export async function transformData (request: TransformationRequest): Promise<JobResult> {
  const response = await http.post('/job', request, {
    validateStatus: status => (status >= 200 && status <= 400)
  }) as AxiosResponse<JobResult>

  return response.data
}
