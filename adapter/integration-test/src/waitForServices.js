const waitOn = require('wait-on')
const {
  ADAPTER_URL,
  MOCK_SERVER_URL,
  RABBIT_HEALTH,
  STARTUP_DELAY
} = require('./env')

const {
  sleep
} = require('./testHelper')

const TIMEOUT = 50000

async function waitForServicesToBeReady () {
  const waitOptions = {
    resources: [
      ADAPTER_URL + '/version',
      MOCK_SERVER_URL + '/',
      RABBIT_HEALTH
    ],
    timeout: TIMEOUT,
    log: false
  }

  await waitOn(waitOptions)
  await sleep(STARTUP_DELAY)
}

module.exports = { waitForServicesToBeReady }
