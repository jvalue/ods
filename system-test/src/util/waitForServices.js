const waitOn = require('wait-on')
const {
  STORAGE_URL,
  STORAGE_MQ_URL,
  SCHEDULER_URL,
  ADAPTER_URL,
  PIPELINE_URL,
  NOTIFICATION_URL,
  MOCK_SERVER_URL
} = require('./env')

const {
  sleep
} = require('./testHelper')

const TIMEOUT = 60000
// This startup delay ensures that the scheduler will be reachable
const STARTUP_DELAY = 2000

async function waitForServicesToBeReady () {
  const waitOptions = {
    resources: [
      STORAGE_URL,
      STORAGE_MQ_URL,
      SCHEDULER_URL,
      PIPELINE_URL,
      NOTIFICATION_URL + '/',
      ADAPTER_URL + '/version',
      MOCK_SERVER_URL + '/'
    ],
    timeout: TIMEOUT,
    log: true
  }

  await waitOn(waitOptions)
  await sleep(STARTUP_DELAY)
}

module.exports = { waitForServicesToBeReady }
