import axios from 'axios'
import PipelineConfig from '../interfaces/pipeline-config'
import PipelineEvent, { EventType } from '../interfaces/pipeline-event'

import * as AMQPClient from './amqp-client'

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
  if(events.length > 0) {
    console.log(`Applying ${events.length} updates for Pipelines:`)
  }

  for(const event of events) {
    console.log(event)
    try {
      await handleEvent(event)
    } catch (e) {
      console.log(`Could not not handle pipeline event ${event.eventId}.\nReason: ${e.message}.\nRetrying in next sync cycle.`)
      return; // making sure not to pull events forward (leave them in order!)
    }
    if(event.eventId > lastSeenEventId) {
      lastSeenEventId = event.eventId
    }
  }
}

async function handleEvent(event: PipelineEvent): Promise<void> {
  switch (event.eventType) {
    case EventType.PIPELINE_DELETE: {
      deletePipelineFromCache(event.pipelineId)
      AMQPClient.publishPipelineDeletion({pipelineId: event.pipelineId})
      break
    }
    case EventType.PIPELINE_CREATE:
      const pipeline = await getPipeline(event.pipelineId)
      AMQPClient.publishPipelineCreation({pipelineId: pipeline.id})
      addPipelineToCache(pipeline)
      break
    case EventType.PIPELINE_UPDATE: {
      const pipeline = await getPipeline(event.pipelineId)
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

export function getCachedPipelineById(pipelineId: number): PipelineConfig | undefined {
  return id_to_pipeline.get(pipelineId)
}

export async function getCachedPipelinesByDatasourceId(datasourceId: number) : Promise<PipelineConfig[]> {
  if (datasourceid_to_pipelines.size === 0) {
    // empty cache -> force sync
    await sync()
  }
  return datasourceid_to_pipelines.get(datasourceId) || []
}

function addPipelineToCache(pipeline: PipelineConfig): void {
  id_to_pipeline.set(pipeline.id, pipeline)

  const storedPipelines = datasourceid_to_pipelines.get(pipeline.datasourceId) || []
  storedPipelines.push(pipeline)
  datasourceid_to_pipelines.set(pipeline.datasourceId, storedPipelines)
}

function deletePipelineFromCache(pipelineId: number) {
  const cachedPipeline = id_to_pipeline.get(pipelineId)
  if(!! cachedPipeline) {
    console.log(`Pipeline ${pipelineId} already deleted from cache.`)
    return
  }

  const datasourceId = cachedPipeline!.datasourceId
  id_to_pipeline.delete(pipelineId)

  const storedPipelines = datasourceid_to_pipelines.get(datasourceId) || []
  const cleanedPipelines = storedPipelines.filter((x) => x.id != pipelineId)
  datasourceid_to_pipelines.set(datasourceId, cleanedPipelines)
}
