import axios from 'axios'
import { useBearer } from '@/keycloak'

const TRANSFORMATION_SERVICE_URL = process.env.VUE_APP_TRANSFORMATION_SERVICE_URL as string

export async function transformData (inputFunc: string): Promise<object> {
  const token = await useBearer().catch(error => {
    console.error('Unable to get keycloak token. Error: ' + error)
  })

  if (token === undefined) {
    return {}
  }

  const http = axios.create({
    baseURL: TRANSFORMATION_SERVICE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })

  const response = await http.post('/', inputFunc)
  return response.data
}
