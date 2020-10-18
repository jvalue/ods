import axios from 'axios'

import { PIPELINE_API } from '../env'
import PipelineConfig from '../clients/PipelineConfig'

const http = axios.create({
  baseURL: PIPELINE_API,
  headers: { 'Content-Type': 'application/json' }
})

export async function getPipeline (pipelineId: number): Promise<PipelineConfig> {
  const response = await http.get(`/pipelines/${pipelineId}`)
  return response.data
}
