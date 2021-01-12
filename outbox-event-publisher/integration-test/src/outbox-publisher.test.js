const fs = require('fs');

const { sleep } = require('@jvalue/node-dry-basics')

const { AmqpConsumer } = require('./amqp-consumer')
const { DockerCompose } = require('./docker-compose')
const { OutboxDatabase } = require('./outbox-database')

const TEST_TIMEOUT_MS = 60000
const STARTUP_WAIT_TIME_MS = 1000
const PUBLICATION_WAIT_TIME_MS = 5000
// debezium has a retry delay of 10 seconds (see retriable.restart.connector.wait.ms property)
const RESTART_WAIT_TIME_MS = 10000

describe('Outbox event publisher', () => {
  let outboxDatabase
  let amqpConsumer
  let receivedMessages

  async function initAmqpConsumer() {
    const amqpConsumer = new AmqpConsumer()
    await amqpConsumer.init(msg => {
      const eventId = msg.properties.messageId
      const routingKey = msg.fields.routingKey
      const payload = JSON.parse(msg.content.toString())
      receivedMessages.push({eventId, routingKey, payload})
    })
    return amqpConsumer
  }

  beforeEach(async () => {
    await DockerCompose('up -d rabbitmq database')
    await sleep(STARTUP_WAIT_TIME_MS)
    await DockerCompose('up -d publisher')
    await sleep(STARTUP_WAIT_TIME_MS)

    outboxDatabase = new OutboxDatabase()
    await outboxDatabase.init()

    receivedMessages = []
    amqpConsumer = await initAmqpConsumer()
  }, TEST_TIMEOUT_MS)

  afterEach(async () => {
    try {
      const escapedTestName = expect.getState().currentTestName.split(' ').join('_')
      const logs = await DockerCompose('logs --no-color')
      if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs')
      }
      fs.writeFileSync(`logs/${escapedTestName}.log`, logs.stdout)

      if (outboxDatabase) {
        await outboxDatabase.close()
      }

      if (amqpConsumer) {
        await amqpConsumer.stop()
      }
    } catch (error) {
      console.log('Cleanup failed', error)
    }

    await DockerCompose('down')
  }, TEST_TIMEOUT_MS)

  test('publishes event from outbox', async () => {
    const routingKey = 'datasource.create'
    const payload = { id: 1, name: 'Test datasource' }

    const eventId = await outboxDatabase.insertEvent(routingKey, payload)

    //Wait for publication
    await sleep(PUBLICATION_WAIT_TIME_MS)

    expect(receivedMessages).toEqual([{ eventId, routingKey, payload }])
  }, TEST_TIMEOUT_MS)

  test.each(['publisher', 'database'])('does not republish event after %s restart', async service => {
    const event1routingKey = 'datasource.create'
    const event1payload = { id: 1, name: 'Test datasource' }

    const event1Id = await outboxDatabase.insertEvent(event1routingKey, event1payload)

    //Wait for publication
    await sleep(PUBLICATION_WAIT_TIME_MS)

    expect(receivedMessages).toEqual([{ eventId: event1Id, routingKey: event1routingKey, payload: event1payload }])

    //Restart service
    await DockerCompose(`stop ${service}`)
    await DockerCompose(`start ${service}`)
    await sleep(RESTART_WAIT_TIME_MS)

    const event2routingKey = 'datasource.update'
    const event2payload = { id: 1, name: 'Updated datasource'}
    const event2Id = await outboxDatabase.insertEvent(event2routingKey, event2payload)

    //Wait for publication
    await sleep(PUBLICATION_WAIT_TIME_MS)

    expect(receivedMessages).toEqual([
      { eventId: event1Id, routingKey: event1routingKey, payload: event1payload },
      { eventId: event2Id, routingKey: event2routingKey, payload: event2payload },
    ])
  }, TEST_TIMEOUT_MS)

  test('does tolerate RabbitMQ restarts', async () => {
    const event1routingKey = 'datasource.create'
    const event1payload = { id: 1, name: 'Test datasource' }

    const event1Id = await outboxDatabase.insertEvent(event1routingKey, event1payload)

    //Wait for publication
    await sleep(PUBLICATION_WAIT_TIME_MS)

    expect(receivedMessages).toEqual([{ eventId: event1Id, routingKey: event1routingKey, payload: event1payload }])

    await amqpConsumer.stop() // close our amqp consumer because we are stopping RabbitMQ

    await DockerCompose('stop rabbitmq')

    // Publish an event
    const event2routingKey = 'datasource.update'
    const event2payload = { id: 1, name: 'Updated datasource'}
    const event2Id = await outboxDatabase.insertEvent(event2routingKey, event2payload)

    await DockerCompose('start rabbitmq')
    await sleep(RESTART_WAIT_TIME_MS)

    amqpConsumer = await initAmqpConsumer()

    await DockerCompose('start publisher')
    await sleep(RESTART_WAIT_TIME_MS)

    // Event1 will be published again, because the first publication failed
    expect(receivedMessages).toEqual([
      { eventId: event1Id, routingKey: event1routingKey, payload: event1payload },
      { eventId: event1Id, routingKey: event1routingKey, payload: event1payload },
      { eventId: event2Id, routingKey: event2routingKey, payload: event2payload },
    ])
  }, TEST_TIMEOUT_MS)

  test('handles two events from one transaction', async () => {
    const eventIds = await outboxDatabase.insertEvents([
      ['entity.create', { id: 42 }],
      ['entity.create', { id: 44 }],
    ])

    //Wait for publication
    await sleep(PUBLICATION_WAIT_TIME_MS)

    expect(receivedMessages).toEqual([
      { eventId: eventIds[0], routingKey: 'entity.create', payload: { id: 42 } },
      { eventId: eventIds[1], routingKey: 'entity.create', payload: { id: 44 } },
    ])
  }, TEST_TIMEOUT_MS)
})
