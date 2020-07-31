import axios, { AxiosResponse } from 'axios'
import TransformationConfig from '@/interfaces/transformation-config'

const TRANSFORMATION_SERVICE_URL = process.env.TRANSFORMATION_SERVICE_URL || 'http://localhost:8083'

const http = axios.create({
  baseURL: TRANSFORMATION_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function executeTransformation (pipelineId: number, pipelineName: string, func: string, dataLocation: string): Promise<TransformationResult> {
  const trigger = {
    pipelineId: pipelineId,
    pipelineName: pipelineName,
    func: func,
    dataLocation: dataLocation
  }
  const response = await http.post(`/config/${pipelineId}/trigger`, trigger)
  return response.data
}

export interface TransformationResult {
  data?: object,
  error?: object
}
