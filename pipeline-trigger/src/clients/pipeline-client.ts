import axios from 'axios'

import { PIPELINE_API } from '../env'
import PipelineConfig from './pipelineConfig'

const http = axios.create({
  baseURL: PIPELINE_API,
  headers: { 'Content-Type': 'application/json' }
})

export async function getPipeline (pipelineId: number): Promise<PipelineConfig> {
  try {
    const response = await http.get(`/configs/${pipelineId}`)
    return response.data
  } catch (e: unknown) {
    console.log(`Fetching pipelines failed. Reason ${JSON.stringify(e)}`)
    throw e
  }
}
