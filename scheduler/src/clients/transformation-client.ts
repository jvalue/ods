import axios, { AxiosResponse } from 'axios'

const TRANSFORMATION_SERVICE_URL = process.env.TRANSFORMATION_SERVICE_URL || 'http://localhost:8083'

const http = axios.create({
  baseURL: TRANSFORMATION_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function executeTransformation (transformationConfig: object): Promise<AxiosResponse> {
  const response = await http.post('/job', transformationConfig)
  return response.data
}

export async function executeNotification (notificationConfig: object): Promise<void> {
  const response = await http.post('/notification', notificationConfig)
  if (response.status !== 202) {
    return Promise.reject(new Error('Error contacting transformation-service'))
  }
}
