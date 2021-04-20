const axios = require('axios')

async function get (url, expectedStatus) {
  const response = await axios.get(url, { validateStatus: () => true })
  expect(response.status).toEqual(expectedStatus)
  return response.data
}

async function post (url, data, expectedStatus) {
  const response = await axios.post(url, data, { validateStatus: () => true })
  expect(response.status).toEqual(expectedStatus)
  return response.data
}

module.exports = {
  get, post
}
