import { useBearer } from '@/keycloak';

export async function transformData(inputFunc: string): Promise<any> {
  console.log(process.env.VUE_APP_TRANSFORMATION_SERVICE_URL);
  const token = await useBearer().catch(error => {
    console.error('Unable to get keycloak token. Error: ' + error);
  });

  if (token === undefined) {
    return;
  }

  return fetch(process.env.VUE_APP_TRANSFORMATION_SERVICE_URL, {
    method: 'POST',
    mode: 'cors',
    body: inputFunc,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
  }).then(response => {
    return response.json();
  });
}

