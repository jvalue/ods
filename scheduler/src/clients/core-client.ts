import axios from 'axios'
import PipelineConfig from '../interfaces/pipeline-config'
import PipelineEvent, { EventType } from '../interfaces/pipeline-event'
import * as StorageClient from './storage-client'

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


/** CONFIG SYNC RELATED **/

const id_to_pipeline = new Map<number, PipelineConfig>();
const datasourceid_to_pipelines = new Map<number, PipelineConfig[]>();

let lastSeenEventId = 0;

export async function initSync (): Promise<void> {
  lastSeenEventId = await getLatestEventId()
  const pipelines = await getAllPipelines()

  for(const pipeline of pipelines) {
    addPipelineToCache(pipeline)
  }
}

export async function sync (): Promise<void> {
  const events = await getEventsAfter(lastSeenEventId)

  for(const event of events) {
    handleEvent(event)
    if(event.eventId > lastSeenEventId) {
      lastSeenEventId = event.eventId
    }
  }
}

async function handleEvent(event: PipelineEvent) {
  const pipeline = await getPipeline(event.pipelineId)
  switch (event.eventType) {
    case EventType.PIPELINE_DELETE: {
      deletePipelineFromCache(pipeline)
      break
    }
    case EventType.PIPELINE_CREATE:
      createStorageStructure(pipeline.id)
      addPipelineToCache(pipeline)
      break
    case EventType.PIPELINE_UPDATE: {
      addPipelineToCache(pipeline)
      break
    }
    default: {
      console.error(`Received unknown event type: ${event.eventType}`)
      console.error(event)
      break
    }
  }
}

export function getCachedPipelineById(pipelineId: number) {
  return id_to_pipeline.get(pipelineId)
}

export function getCachedPipelinesByDatasourceId(datasourceId: number) : PipelineConfig[] {
  return datasourceid_to_pipelines.get(datasourceId) || []
}

function addPipelineToCache(pipeline: PipelineConfig) {
  id_to_pipeline.set(pipeline.id, pipeline)

  const storedPipelines = datasourceid_to_pipelines.get(pipeline.datasourceId) || []
  storedPipelines.push(pipeline)
  datasourceid_to_pipelines.set(pipeline.datasourceId, storedPipelines)
}

function deletePipelineFromCache(pipeline: PipelineConfig) {
  id_to_pipeline.delete(pipeline.id)

  const storedPipelines = datasourceid_to_pipelines.get(pipeline.datasourceId) || []
  const cleanedPipelines = storedPipelines.filter((x) => x.id != pipeline.id)
  datasourceid_to_pipelines.set(pipeline.datasourceId, cleanedPipelines)
}

async function createStorageStructure (pipelineId: number, retries = 10): Promise<void> {
  try {
    console.log(`Creating storage structur for pipeline ${pipelineId}`)
    return await StorageClient.createStructure(pipelineId)
  } catch (e) {
    if (retries === 0) {
      return Promise.reject(new Error(`Could not create storage structure for pipeline ${pipelineId}.`))
    }
    if (e.code === '400') {
      console.log(e.message)
    }
    if (e.code === '404') {
      console.error(`Failed to communicate with Storage Service (${retries}) . Retrying ... `)
    } else {
      console.error(e)
      console.error(`Retrying (${retries})...`)
    }
    await new Promise(resolve => setTimeout(resolve, 1000)) // sleep
    return createStorageStructure(retries - 1)
  }
}
