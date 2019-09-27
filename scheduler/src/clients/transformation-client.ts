import axios, { AxiosResponse } from 'axios'

const TRANSFORMATION_SERVICE_URL = process.env.TRANSFORMATION_SERVICE_URL || 'http://localhost:8083'
const TRANSFORMATION_SERVICE_IMPORT_URL = TRANSFORMATION_SERVICE_URL + '/job'

const http = axios.create({
  baseURL: TRANSFORMATION_SERVICE_IMPORT_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function executeTransformation (transformationConfig: object): Promise<AxiosResponse> {
  const response = await http.post('/', transformationConfig)
  return response.data
}
