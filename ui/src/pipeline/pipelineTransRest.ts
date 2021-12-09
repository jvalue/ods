import axios, { AxiosInstance } from 'axios';

import { TransformedDataMetaData } from './pipeline';

export class PipelineTransRest {
  private readonly http: AxiosInstance;

  constructor(pipelineServiceUrl: string) {
    /**
     * Axios instances with default headers and base url.
     * The option transformResponse is set to an empty array
     * because of explicit JSON.parser call with custom reviver.
     */
    this.http = axios.create({
      baseURL: `${pipelineServiceUrl}/transdata`,
      headers: { 'Content-Type': 'application/json' },
      transformResponse: [],
    });
  }

  async getLatestTransformedData(id: number): Promise<TransformedDataMetaData> {
    const importResponse = await this.http.get<string>(
      `/${id}/transforms/latest`,
    );
    const jsonResponse = JSON.parse(
      importResponse.data,
    ) as TransformedDataMetaData;
    return jsonResponse;
  }
}
