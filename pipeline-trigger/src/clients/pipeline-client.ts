import axios from 'axios'

import { PIPELINE_API } from '../env'
import PipelineConfig from './pipelineConfig'

const http = axios.create({
  baseURL: PIPELINE_API,
  headers: { 'Content-Type': 'application/json' }
})

export async function getPipeline (pipelineId: number): Promise<PipelineConfig> {
  const response = await http.get(`/pipelines/${pipelineId}`)
    .catch((e) => {
      console.log(`Could not fetch pipeline with id ${pipelineId}. Reason ${e.message}`)
      throw e
    })
  return response.data
}
