import * as AdapterClient from './clients/adapter-client'
import * as TransformationClient from './clients/transformation-client'
import * as StorageClient from './clients/storage-client'
import * as Scheduler from './pipeline-scheduling'

import PipelineConfig from './interfaces/pipeline-config'

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
      await executeStorage(pipelineConfig, transformedData)
      await executeNotifications(pipelineConfig, transformedData)
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
  }
}

async function executeAdapter (pipelineConfig: PipelineConfig): Promise<object> {
  console.log(`Execute Adapter for Pipeline ${pipelineConfig.id}`)
  try {
    const importedData = await AdapterClient.executeAdapter(pipelineConfig)
    console.log(`Sucessful import via Adapter for Pipeline ${pipelineConfig.id}`)
    return importedData
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      console.log(`Failed to import data via Adapter for Pipeline ${pipelineConfig.id}. Adapter Service not reachable`)
    } else {
      console.log(`Failed to import data via Adapter for Pipeline ${pipelineConfig.id}. Unknown error!`)
      console.error(e)
    }
    throw Error('Failed to import data via Adapter Service')
  }
}

async function executeTransformations (pipelineConfig: PipelineConfig, data: object): Promise<object> {
  console.log(`Execute Pipeline Transformation ${pipelineConfig.id}`)
  let lastPartialResult = data

  try {
    for (const transformation of pipelineConfig.transformations) {
      const currentTransformation = JSON.parse(JSON.stringify(transformation)) // deeply copy object
      currentTransformation.data = lastPartialResult
      lastPartialResult = await TransformationClient.executeTransformation(currentTransformation)
    }
    console.log(`Sucessfully transformed data for Pipeline ${pipelineConfig.id}`)
    return lastPartialResult
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      console.log(`Failed to transform data for Pipeline ${pipelineConfig.id}. Transformation Service not reachable`)
    } else {
      console.log(`Failed to transform data for Pipeline ${pipelineConfig.id}. Unknown error!`)
      console.error(e)
    }
    throw Error('Failed to transform data via Transformation Service')
  }
}

async function executeStorage (pipelineConfig: PipelineConfig, data: object): Promise<void> {
  try {
    await StorageClient.executeStorage(pipelineConfig, data)
    console.log(`Sucessfully stored Data for Pipeline ${pipelineConfig.id}`)
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      console.log(`Failed to store Data for Pipeline ${pipelineConfig.id}. Storage Service not reachable`)
    } else {
      console.log(`Failed to store Data for Pipeline ${pipelineConfig.id}. Unknown error!`)
      console.error(e)
    }
    throw Error('Failed to store data via Storage Service')
  }
}

async function executeNotifications (pipelineConfig: PipelineConfig, data: object): Promise<void> {
  try {
    for (const notification of pipelineConfig.notifications) {
      notification.data = data
      await TransformationClient.executeNotification(notification)
    }
    console.log(`Successfully delivered notification requests to transformation-service for ${pipelineConfig.id}`)
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      console.log(`Failed to trigger notifications for Pipeline ${pipelineConfig.id}. ` +
                  'Transformation Service not reachable')
    } else {
      console.log(`Failed to trigger notifications for Pipeline ${pipelineConfig.id}. Unknown error!`)
      console.error(e)
    }
    throw Error('Failed to trigger notifications via Transformation Service')
  }
}
function sleep (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
