import axios from 'axios'

import PipelineConfig from './pipeline-config'

const STORAGE_SERVICE_URL = process.env.STORAGE_SERVICE_URL || 'http://localhost:8084'

export async function executeStorage (pipelineConfig: PipelineConfig, data: any): Promise<void> {

  const requestBody: any = {}
  requestBody.data = data
  requestBody.pipelineId = pipelineConfig.id
  requestBody.timestamp = new Date(Date.now())
  requestBody.origin = !!pipelineConfig.adapter && !!pipelineConfig.adapter.location ? pipelineConfig.adapter.location : 'UNKNOWN'
  requestBody.license = !!pipelineConfig.metadata && !!pipelineConfig.metadata.license ? pipelineConfig.metadata.license : 'UNKNOWN'

  await axios.post<any>(
    getDataRequestUrl(pipelineConfig.id),
    requestBody,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

export async function createStructure (pipelineId: number): Promise<void> {
  const requestBody: any = {
    'pipelineid': pipelineId
  }
  const requestURI = `${STORAGE_SERVICE_URL}/rpc/createstructurefordatasource`

  await axios.post<void>(
    requestURI,
    requestBody,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

function getDataRequestUrl (pipelineId: number): string {
  return `${STORAGE_SERVICE_URL}/${pipelineId}`
}
