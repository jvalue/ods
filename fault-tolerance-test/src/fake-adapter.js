const express = require('express')

const { publishEvent } = require('./util/amqp')

const FAKE_ADAPTER_PORT = 8080

const app = express()
app.get('/', (req, res) => {
  res.send('I am alive')
})

app.get('/datasources', (req, res) => {

  console.log('Scheduler requesting datasources')

  //Create the response, but do not send it immediately to simulate slow network
  const response = [getDatasource(42)]

  //Delete the datasource => send event
  publishEvent('datasource.config.deleted', {datasource: getDatasource(42)})
    .catch(error => console.log("Failed to publish delete event:", error))

  //Send the message after 100ms to simulate slow network
  setTimeout(() => res.json(response), 100)
})

app.listen(FAKE_ADAPTER_PORT, () => console.log('Fake adapter running'))

function getDatasource(id) {
  return {
    id,
    trigger: {
      periodic: false,
      firstExecution: Date.now() + 30000,
      interval: 10000 // 10 seconds
    }
  }
}
