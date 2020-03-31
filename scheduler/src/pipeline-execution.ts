import * as AdapterClient from './clients/adapter-client'
import * as TransformationClient from './clients/transformation-client'
import * as StorageClient from './clients/storage-client'
import * as Scheduler from './pipeline-scheduling'

import PipelineConfig from './interfaces/pipeline-config'
import { AxiosError } from 'axios'
import AdapterResponse from '@/interfaces/adapter-response'

export async function executePipeline (pipelineConfig: PipelineConfig, maxRetries = 3): Promise<void> {
  console.log(`Execute Pipeline ${pipelineConfig.id}`)

  let retryNumber = 0
  let pipelineSuccess = false
  while (!pipelineSuccess && retryNumber <= maxRetries) {
    if (retryNumber > 0) {
      await sleep(1000)
      console.log(`Starting retry ${retryNumber} of Pipeline ${pipelineConfig.id}`)
    }
    try {
      const adapterResponse: AdapterResponse = await executeAdapter(pipelineConfig)
      let data: object
      if (pipelineConfig.transformation) {
        data = await executeTransformation(pipelineConfig, adapterResponse.location)
      } else {
        data = await AdapterClient.fetchImportedData(adapterResponse.id)
        console.log('No transformation specified, fetching data from adapter.')
      }
      const dataLocation = await executeStorage(pipelineConfig, data)
      await executeNotifications(pipelineConfig, data, dataLocation)
      pipelineSuccess = true
      console.log(`Successfully executed Pipeline ${pipelineConfig.id}`)
    } catch (e) {
      console.log(`Pipeline ${pipelineConfig.id} failed!`)
      retryNumber++
    }
  }

  if (pipelineConfig.trigger.periodic) {
    Scheduler.schedulePipeline(pipelineConfig)
  } else {
    console.log(`Pipeline ${pipelineConfig.id}  is not periodic. Removing it from scheduling.`)
    Scheduler.removePipelineJob(pipelineConfig.id)
    console.log(`Succesfully removed pipeline ${pipelineConfig.id} from scheduling.`)
  }
}

async function executeAdapter (pipelineConfig: PipelineConfig): Promise<AdapterResponse> {
  console.log(`Execute Adapter for Pipeline ${pipelineConfig.id}`)
  try {
    const adapterResponse = await AdapterClient.executeAdapter(pipelineConfig.adapter)
    console.log(`Sucessfully triggered import via Adapter for Pipeline ${pipelineConfig.id}`)
    return adapterResponse
  } catch (e) {
    handleError(e)
    throw Error('Failed to import data via Adapter Service')
  }
}

async function executeTransformation (pipelineConfig: PipelineConfig, dataLocation: string): Promise<object> {
  console.log(`Execute Pipeline Transformation ${pipelineConfig.id}`)
  if (!pipelineConfig.transformation) {
    throw new Error('Illegal state: attempting to execute undefined transformation.')
  }
  try {
    const jobResult = await TransformationClient.executeTransformation(pipelineConfig.transformation, dataLocation)
    return jobResult.data
  } catch (e) {
    handleError(e)
    throw new Error('Failed to transform Data via Transformation Service')
  }
}

async function executeStorage (pipelineConfig: PipelineConfig, data: object): Promise<string> {
  try {
    const dataLocation = await StorageClient.executeStorage(pipelineConfig, data)
    console.log(`Sucessfully stored Data for Pipeline ${pipelineConfig.id}`)
    return dataLocation
  } catch (e) {
    handleError(e)
    throw Error('Failed to store data via Storage Service')
  }
}

async function executeNotifications (
  pipelineConfig: PipelineConfig, data: object, dataLocation: string): Promise<void> {
  try {
    pipelineConfig.notifications.map(async n => {
      n.data = data
      n.dataLocation = dataLocation
      n.pipelineId = pipelineConfig.id
      n.pipelineName = pipelineConfig.metadata.displayName
      await TransformationClient.executeNotification(n)
    })
    console.log(`Successfully delivered notification requests to transformation-service for ${pipelineConfig.id}`)
  } catch (e) {
    handleError(e)
    throw Error('Failed to trigger notifications via Transformation Service')
  }
}

function sleep (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function handleError (e: AxiosError): void {
  if (e.response) {
    // Request was made and Response code is not 2xx
    console.log(`${e.message}: Request ${e.config.method} ${e.config.url} failed.
      The server responded with ${e.response.status}, data: ${JSON.stringify(e.response.data)}`)
  } else if (e.request) {
    // Request was made but no response received
    console.log(`${e.message}: Request ${e.config.method} ${e.config.url} did not receive a response`)
  } else {
    console.log(`Unknown error: ${e.message}`)
  }
}
