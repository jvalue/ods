import axios from 'axios'

import PipelineConfig from '../interfaces/pipeline-config'

const STORAGE_SERVICE_URL = process.env.STORAGE_SERVICE_URL || 'http://localhost:8084'

export async function executeStorage (pipelineConfig: PipelineConfig, data: object): Promise<string> {
  const dataLocation: string = getDataRequestUrl(pipelineConfig.id)
  const requestBody: object = {
    data,
    pipelineId: pipelineConfig.id,
    timestamp: new Date(Date.now()),
    origin: 'CURRENTLY NOT SUPPORTED',
    license: !!pipelineConfig.metadata && !!pipelineConfig.metadata.license
      ? pipelineConfig.metadata.license : 'UNKNOWN'
  }

  await axios.post<object>(
    dataLocation,
    requestBody,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )

  return dataLocation
}

export async function createStructure (pipelineId: number): Promise<void> {
  const requestBody: object = {
    pipelineid: pipelineId + ''
  }
  const requestURI = `${STORAGE_SERVICE_URL}/rpc/createstructurefordatasource`

  try {
    await axios.post<void>(
      requestURI,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (e) {
    if (e.response.data.code === '42P07') {
      // the structure already exists
      console.log('Database structure for pipeline {pipelineId} already exists.')
    } else {
      throw e
    }
  }
}

function getDataRequestUrl (pipelineId: number): string {
  return `${STORAGE_SERVICE_URL}/${pipelineId}`
}
