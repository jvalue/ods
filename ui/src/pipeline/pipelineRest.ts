import Pipeline from './pipeline'

const CORE_SERVICE_URL = process.env.VUE_APP_CORE_SERVICE_URL as string
export async function getAllPipelines (): Promise<Pipeline[]> {
  const response = await fetch(`${CORE_SERVICE_URL}/pipelines`)
  const data = await response.json()
  return data
}

export async function createPipeline (pipeline: Pipeline): Promise<Pipeline> {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pipeline) }

  const response = await fetch(`${CORE_SERVICE_URL}/pipelines`, options)
  const data = await response.json()
  return data
}

export async function updatePipeline (pipeline: Pipeline): Promise<Response> {
  const options = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pipeline) }

  return fetch(`${CORE_SERVICE_URL}/pipelines/${pipeline.id}`, options)
}

export async function deletePipeline (pipelineId: string): Promise<Response> {
  const options = { method: 'DELETE' }
  return fetch(`${CORE_SERVICE_URL}/pipelines/${pipelineId}`, options)
}
