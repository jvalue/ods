import axios from 'axios';

import { ADAPTER_SERVICE_URL } from '../../env';
import type DatasourceConfig from '../datasource-config';

const http = axios.create({
  baseURL: ADAPTER_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export async function getAllDatasources(): Promise<DatasourceConfig[]> {
  const response = await http.get('/datasources');
  return response.data as DatasourceConfig[];
}
