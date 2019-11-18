import axios, { AxiosResponse } from 'axios'
import { useBearer } from '@/keycloak'

import JobResult from './interfaces/jobResult'
import TransformationRequest from './interfaces/transformationRequest'

const TRANSFORMATION_SERVICE_URL = process.env.VUE_APP_TRANSFORMATION_SERVICE_URL as string

export async function transformData (request: TransformationRequest): Promise<JobResult> {
  const token = await useBearer().catch(error => {
    console.error('Unable to get keycloak token. Error: ' + error)
    return Promise.reject(error)
  })

  const http = axios.create({
    baseURL: TRANSFORMATION_SERVICE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })

  const response = await http.post('/job', request, {
    validateStatus: status => (status >= 200 && status <= 400)
  }) as AxiosResponse<JobResult>

  return response.data
}
