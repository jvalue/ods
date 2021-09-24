import axios from 'axios';

import { JobResult, TransformationRequest } from './transformation';

import { PIPELINE_SERVICE_URL } from '@/env';

const http = axios.create({
  baseURL: PIPELINE_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function transformData(
  request: TransformationRequest,
): Promise<JobResult> {
  const response = await http.post('/job', request, {
    validateStatus: status => status >= 200 && status <= 400,
  });

  return response.data as JobResult;
}
