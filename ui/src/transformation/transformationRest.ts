import { useBearer } from '@/keycloak'

const TRANSFORMATION_SERVICE_URL = process.env.TRANSFORMATION_SERVICE_URL as string

// TODO: remove if possible
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function transformData (inputFunc: string): Promise<any> {
  console.log(process.env.VUE_APP_TRANSFORMATION_SERVICE_URL)
  const token = await useBearer().catch(error => {
    console.error('Unable to get keycloak token. Error: ' + error)
  })

  if (token === undefined) {
    return
  }

  return fetch(TRANSFORMATION_SERVICE_URL, {
    method: 'POST',
    mode: 'cors',
    body: inputFunc,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  }).then(response => {
    return response.json()
  })
}
