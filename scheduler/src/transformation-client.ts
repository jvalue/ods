import axios from 'axios'

const TRANSFORMATION_SERVICE_URL = process.env.TRANSFORMATION_SERVICE_URL || 'http://localhost:8083'
const TRANSFORMATION_SERVICE_IMPORT_URL = TRANSFORMATION_SERVICE_URL + '/job'

export async function executeTransformation(transformationConfig: any): Promise<any> {

    const response = await axios.post(
        TRANSFORMATION_SERVICE_IMPORT_URL, 
        transformationConfig, 
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    )
    return response.data
}
