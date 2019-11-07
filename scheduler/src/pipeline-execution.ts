import * as AdapterClient from './clients/adapter-client'
import * as TransformationClient from './clients/transformation-client'
import * as StorageClient from './clients/storage-client'
import * as Scheduler from './pipeline-scheduling'

import PipelineConfig from './interfaces/pipeline-config'
import { AxiosError } from 'axios'

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
      const importedData: object = await executeAdapter(pipelineConfig)
      const transformedData = await executeTransformations(pipelineConfig, importedData)
      const dataLocation = await executeStorage(pipelineConfig, transformedData)
      await executeNotifications(pipelineConfig, transformedData, dataLocation)
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

async function executeAdapter (pipelineConfig: PipelineConfig): Promise<object> {
  console.log(`Execute Adapter for Pipeline ${pipelineConfig.id}`)
  try {
    const importedData = await AdapterClient.executeAdapter(pipelineConfig)
    console.log(`Sucessful import via Adapter for Pipeline ${pipelineConfig.id}`)
    return importedData
  } catch (e) {
    handleError(e)
    throw Error('Failed to import data via Adapter Service')
  }
}

async function executeTransformations (pipelineConfig: PipelineConfig, data: object): Promise<object> {
  console.log(`Execute Pipeline Transformation ${pipelineConfig.id}`)
  let lastData = data

  try {
    for (const transformation of pipelineConfig.transformations) {
      const currentTransformation = JSON.parse(JSON.stringify(transformation)) // deeply copy object
      currentTransformation.data = lastData
      const jobResult = await TransformationClient.executeTransformation(currentTransformation)
      lastData = jobResult.data
      console.log(`Transformation executed for Pipeline ${pipelineConfig.id},
       resulting data: ${JSON.stringify(lastData)}.`)
    }
    console.log(`Sucessfully transformed data for Pipeline ${pipelineConfig.id}`)
    return lastData
  } catch (e) {
    handleError(e)
    throw Error('Failed to transform data via Transformation Service')
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
    console.log(`${e.message}: Requesting ${e.config.method} ${e.config.url}
      the server responded with ${e.response.status}, data: ${e.response.data}`)
  } else if (e.request) {
    // Request was made but no response received
    console.log(`${e.message}: Request ${e.config.method} ${e.config.url} did not receive a response`)
  } else {
    console.log(`Unknown error: ${e.message}`)
  }
}
