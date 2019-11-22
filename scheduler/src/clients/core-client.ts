import axios from 'axios'
import PipelineConfig from '../interfaces/core/pipeline-config'
import PipelineEvent from '../interfaces/core/pipeline-event'

export const CONFIG_SERVICE_URL = process.env.CONFIG_SERVICE_URL || 'http://localhost:8081'
const CONFIG_SERVICE_PIPELINES_URL = CONFIG_SERVICE_URL + '/pipelines'
const CONFIG_SERVICE_EVENTS_URL = CONFIG_SERVICE_URL + '/events'

const httpPipelines = axios.create({
  baseURL: CONFIG_SERVICE_PIPELINES_URL,
  headers: { 'Content-Type': 'application/json' }
})

const httpEvents = axios.create({
  baseURL: CONFIG_SERVICE_EVENTS_URL
})

export async function getAllPipelines (): Promise<PipelineConfig[]> {
  const response = await httpPipelines.get('/')
  return response.data
}

export async function getPipeline (pipelineId: number): Promise<PipelineConfig> {
  const response = await httpPipelines.get(`/${pipelineId}`)
  return response.data
}

export async function getEventsAfter (eventId: number): Promise<PipelineEvent[]> {
  const response = await httpEvents.get(`?after=${eventId}`)
  return response.data
}

export async function getLatestEventId (): Promise<number> {
  const response = await httpEvents.get('/latest')
  return response.data.eventId || 0
}
