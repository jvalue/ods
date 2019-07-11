import axios from 'axios'

import PipelineConfig from './pipeline-config'

const ADAPTER_SERVICE_URL = process.env.ADAPTER_SERVICE_URL || 'http://localhost:8082'
const ADAPTER_SERVICE_IMPORT_URL = ADAPTER_SERVICE_URL + '/dataImport'

export async function executeAdapter(pipelineConfig: PipelineConfig): Promise<any> {

    const response = await axios.post<any>(
        ADAPTER_SERVICE_IMPORT_URL, 
        pipelineConfig.adapter, 
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    )
    return response.data;
}
