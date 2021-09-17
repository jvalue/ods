import axios, { AxiosResponse } from 'axios';

import Pipeline from './pipeline';

import { PIPELINE_SERVICE_URL } from '@/env';

/**
 * Axios instances with default headers and base url.
 * The option transformResponse is set to an empty array
 * because of explicit JSON.parser call with custom reviver.
 */
const httpPipelineConfigs = axios.create({
  baseURL: `${PIPELINE_SERVICE_URL}/configs`,
  headers: { 'Content-Type': 'application/json' },
  transformResponse: [],
});

export async function getAllPipelines(): Promise<Pipeline[]> {
  const response = await httpPipelineConfigs.get('/');
  return JSON.parse(response.data) as Pipeline[];
}

export async function getPipelineById(id: number): Promise<Pipeline> {
  const response = await httpPipelineConfigs.get(`/${id}`);
  return JSON.parse(response.data) as Pipeline;
}

export async function getPipelineByDatasourceId(datasourceId: number): Promise<Pipeline> {
  const response = await httpPipelineConfigs.get(`?datasourceId=${datasourceId}`);
  return JSON.parse(response.data) as Pipeline;
}

export async function createPipeline(pipeline: Pipeline): Promise<Pipeline> {
  const response = await httpPipelineConfigs.post('/', JSON.stringify(pipeline));
  return JSON.parse(response.data) as Pipeline;
}

export async function updatePipeline(pipeline: Pipeline): Promise<AxiosResponse> {
  return await httpPipelineConfigs.put(`/${pipeline.id}`, JSON.stringify(pipeline));
}
export async function deletePipeline(id: number): Promise<AxiosResponse> {
  return await httpPipelineConfigs.delete(`/${id}`);
}
