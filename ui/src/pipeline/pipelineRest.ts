import axios, { AxiosInstance } from 'axios';

import Pipeline from './pipeline';

export class PipelineRest {
  private readonly httpPipelineConfigs: AxiosInstance;

  constructor(pipelineServiceUrl: string) {
    /**
     * Axios instances with default headers and base url.
     * The option transformResponse is set to an empty array
     * because of explicit JSON.parser call with custom reviver.
     */
    this.httpPipelineConfigs = axios.create({
      baseURL: `${pipelineServiceUrl}/configs`,
      headers: { 'Content-Type': 'application/json' },
      transformResponse: [],
    });
  }

  async getAllPipelines(): Promise<Pipeline[]> {
    const response = await this.httpPipelineConfigs.get('/');
    return JSON.parse(response.data) as Pipeline[];
  }

  async getPipelineById(id: number): Promise<Pipeline> {
    const response = await this.httpPipelineConfigs.get(`/${id}`);
    return JSON.parse(response.data) as Pipeline;
  }

  async getPipelinesByDatasourceId(datasourceId: number): Promise<Pipeline[]> {
    const response = await this.httpPipelineConfigs.get(
      `?datasourceId=${datasourceId}`,
    );
    return JSON.parse(response.data) as Pipeline[];
  }

  async createPipeline(pipeline: Pipeline): Promise<Pipeline> {
    const response = await this.httpPipelineConfigs.post(
      '/',
      JSON.stringify(pipeline),
    );
    return JSON.parse(response.data) as Pipeline;
  }

  async updatePipeline(pipeline: Pipeline): Promise<Pipeline> {
    const response = await this.httpPipelineConfigs.put(
      `/${pipeline.id}`,
      JSON.stringify(pipeline),
    );
    return JSON.parse(response.data) as Pipeline;
  }

  async deletePipeline(id: number): Promise<Pipeline | undefined> {
    const response = await this.httpPipelineConfigs.delete(`/${id}`);

    if (response.status === 204) {
      return undefined;
    }

    return JSON.parse(response.data) as Pipeline;
  }
}
