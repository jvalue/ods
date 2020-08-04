import * as AdapterClient from './clients/adapter-client'
import * as TransformationClient from './clients/transformation-client'

import DatasourceConfig from './interfaces/datasource-config'
import { AxiosError } from 'axios'
import AdapterResponse from '@/interfaces/adapter-response'

export async function execute (datasourceConfig: DatasourceConfig, maxRetries = 3): Promise<void> {
  // adapter
  const adapterResponse: AdapterResponse =
      await retryableExecution(executeAdapter, datasourceConfig, `Executing adapter for datasource ${datasourceConfig.id}`)

  // pipeline
  await retryableExecution(triggerPipelines, { datasourceId: datasourceConfig.id, dataLocation: adapterResponse.location }, `Triggering pipelines based on datasource ${datasourceConfig.id}`)
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

  try {
    const importedData = await AdapterClient.executeAdapter(dataousrceConfig)
    console.log(`Sucessful import via Adapter for Datasource ${dataousrceConfig.id}`)
    return importedData
  } catch (e) {
    console.log(`Error executing adapter: ${e.code}`)
    return Promise.reject()
  }
}

async function triggerPipelines (args: { datasourceId: number; dataLocation: string }): Promise<void> {
  const datasourceId = args.datasourceId
  const dataLocation = args.dataLocation

  console.log(`Trigger all pipelines targeting datasource ${datasourceId}`)

  try {
    await TransformationClient.triggerPipelines(datasourceId, dataLocation)
  } catch (e) {
    handleError(e)
    throw new Error('Failed trigger pipelines')
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
