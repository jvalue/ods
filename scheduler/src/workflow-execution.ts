import * as AdapterClient from './clients/adapter-client'
import * as CoreClient from './clients/core-client'
import * as TransformationClient from './clients/transformation-client'
import * as StorageClient from './clients/storage-client'
import { AmqpClient, NotificationTriggerEvent } from './clients/amqp-client'

import DatasourceConfig from './interfaces/datasource-config'
import PipelineConfig from './interfaces/pipeline-config'
import { AxiosError } from 'axios'
import AdapterResponse from '@/interfaces/adapter-response'

const amqpClient = new AmqpClient()
amqpClient.init()

export async function execute (datasourceConfig: DatasourceConfig, maxRetries = 3): Promise<void> {
  // adapter
  const adapterResponse: AdapterResponse =
      await retryableExecution(executeAdapter, datasourceConfig, `Executing adapter for datasource ${datasourceConfig.id}`)

  // pipeline
  const followingPipelines = await CoreClient.getCachedPipelinesByDatasourceId(datasourceConfig.id)
  for (const pipelineConfig of followingPipelines) {
    const transformationResult =
        await retryableExecution(executeTransformation, { pipelineConfig: pipelineConfig, dataLocation: adapterResponse.location }, `Executing transformatins for pipeline ${pipelineConfig.id}`)

    if (transformationResult.error) {
      console.log(`Transformation for pipeline ${pipelineConfig.id} went wrong. Not storing data or sending notifications.`)
      continue
    }

    const dataLocation =
        await retryableExecution(executeStorage, { pipelineConfig: pipelineConfig, data: transformationResult.data! }, `Storing data for pipeline ${pipelineConfig.id}`)

    await retryableExecution(executeNotification, { pipelineConfig: pipelineConfig, dataLocation: dataLocation, data: transformationResult.data, error: transformationResult.error }, `Notifying clients for pipeline ${pipelineConfig.id}`)
  }
}

async function retryableExecution<T1, T2> (func: (arg: T1) => Promise<T2>, args: T1, description: string, maxRetries = 3): Promise<T2> {
  let retryNumber = 0
  while (retryNumber <= maxRetries) {
    if (retryNumber > 0) {
      await sleep(1000)
      console.log(`Starting retry ${retryNumber} of ${description}`)
    }
    try {
      return await func(args)
    } catch (e) {
      console.log(`${description} failed!`)
      console.log(e.message)
      retryNumber++
    }
  }
  throw new Error(`Execution of ${description} failed!`)
}

async function executeAdapter (dataousrceConfig: DatasourceConfig): Promise<AdapterResponse> {
  console.log(`Execute Adapter for Datasource ${dataousrceConfig.id}`)

  const importedData = await AdapterClient.executeAdapter(dataousrceConfig)
  console.log(`Sucessful import via Adapter for Datasource ${dataousrceConfig.id}`)
  return importedData
}

async function executeTransformation (args: { pipelineConfig: PipelineConfig; dataLocation: string }): Promise<TransformationClient.TransformationResult> {
  const pipelineConfig = args.pipelineConfig
  const dataLocation = args.dataLocation

  console.log(`Execute Pipeline Transformation ${pipelineConfig.id}`)
  if (!pipelineConfig.transformation) {
    pipelineConfig.transformation = {
      dataLocation: AdapterClient.ADAPTER_SERVICE_URL + dataLocation
    }
    console.log('Transformation undefined. ')
  }
  try {
    pipelineConfig.transformation.dataLocation = AdapterClient.ADAPTER_SERVICE_URL + dataLocation
    const jobResult = await TransformationClient.executeTransformation(pipelineConfig.transformation)
    return jobResult
  } catch (e) {
    handleError(e)
    throw new Error('Failed to transform Data via Transformation Service')
  }
}

async function executeStorage (args: { pipelineConfig: PipelineConfig; data: object }): Promise<string> {
  const pipelineConfig = args.pipelineConfig
  const data = args.data

  console.log(`Storing data for ${pipelineConfig.id}`)
  const dataLocation = await StorageClient.executeStorage(pipelineConfig, data)
  console.log(`Sucessfully stored Data for Pipeline ${pipelineConfig.id}`)
  return dataLocation
}

async function executeNotification (args: { pipelineConfig: PipelineConfig; dataLocation: string; data?: object; error?: object }): Promise<void> {
  const pipelineConfig = args.pipelineConfig
  const data = args.data
  const error = args.error

  const notificationTrigger: NotificationTriggerEvent = {
    dataLocation: args.dataLocation,
    pipelineId: pipelineConfig.id,
    pipelineName: pipelineConfig.metadata.displayName,
    data: data,
    error: error
  }

  const success = amqpClient.publish(notificationTrigger)
  if (!success) {
    Promise.reject()
  } else {
    console.log(`Successfully published notification trigger to amqp exchange for pipeline ${pipelineConfig.id}`)
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
