const waitOn = require('wait-on')
const {
  ADAPTER_URL,
  MOCK_SERVER_URL,
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
      MOCK_SERVER_URL + '/'
    ],
    timeout: TIMEOUT,
    log: false
  }
  try {
    await waitOn(waitOptions)
    await sleep(STARTUP_DELAY)
  } catch (err) {
    throw new Error('Error during setup of tests: ' + err)
  }
}

module.exports = { waitForServicesToBeReady }
