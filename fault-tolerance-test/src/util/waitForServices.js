const waitOn = require('wait-on')

const { ADAPTER_URL, SCHEDULER_URL, STORAGE_MQ_URL, STORAGE_URL, PIPELINE_URL, NOTIFICATION_URL, AMQP_URL } = require('./env')

const TIMEOUT = 60000

const ALL_SERVICES = [
  `${ADAPTER_URL}/datasources`,
  SCHEDULER_URL,
  STORAGE_MQ_URL,
  STORAGE_URL,
  `${PIPELINE_URL}/configs`,
  `${NOTIFICATION_URL}/configs`,
  // RabbitMQ does allow opening a TCP connection before being ready, so this does not wait for RabbitMQ being
  // fully initialized
  `tcp:${AMQP_URL.substring(AMQP_URL.indexOf('@') + 1)}`
]

async function waitForServicesToBeReady (services = ALL_SERVICES) {
  const waitOptions = {
    resources: services,
    timeout: TIMEOUT,
    log: false
  }

  try {
    await waitOn(waitOptions)
  } catch (error) {
    // Throw our own Error to get a nicer stack trace without the clutter from wait-on
    throw new Error(error.message)
  }
}

module.exports = { waitForServicesToBeReady }
