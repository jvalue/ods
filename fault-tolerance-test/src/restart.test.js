const axios = require('axios')
const Docker = require('dockerode')
const { sleep } = require('@jvalue/node-dry-basics')

const { ADAPTER_URL, NOTIFICATION_URL, PIPELINE_URL, STORAGE_URL, STORAGE_MQ_URL, DOCKER_COMPOSE_FILE, ENV_FILE } = require('./util/env')
const { DockerCompose, writeDockerLogs } = require('./util/docker-compose')
const { waitForServicesToBeReady } = require('./util/waitForServices')
const { publishEvent } = require('./util/amqp')

const SECOND = 1000
const MINUTE = 60 * SECOND
const TEST_TIMEOUT = 5 * MINUTE

const ALL_SERVICES = [
  'adapter',
  'adapter-db',
  'adapter-outboxer',
  'edge',
  'notification',
  'notification-db',
  'pipeline',
  'pipeline-db',
  'pipeline-outboxer',
  'rabbitmq',
  'scheduler',
  'storage',
  'storage-db',
  // 'storage-db-liquibase', //Only create the database schema and then exits, therefore ignore
  'storage-mq',
].sort()

const SERVICES_TO_KILL = [
  ['adapter', initAdapter, testAdapter],
  ['adapter-db', initAdapter, testAdapter],
  ['adapter-outboxer', undefined, undefined],
  ['notification', initNotification, testNotification],
  ['notification-db', initNotification, testNotification],
  ['pipeline', initPipeline, testPipeline],
  ['pipeline-db', initPipeline, testPipeline],
  ['pipeline-outboxer', undefined, undefined],
  // rabbitmq has separate test method
  ['scheduler', undefined, undefined],
  ['storage', initStorage, testStorage],
  ['storage-db', initStorage, testStorage],
  ['storage-mq', initStorage, testStorage],
]

function getComposeName(container) {
  return container.Labels['com.docker.compose.service']
}

describe('Restart test', () => {
  let dockerCompose
  let docker

  beforeAll(() => {
    dockerCompose = DockerCompose(DOCKER_COMPOSE_FILE, ENV_FILE)
    docker = new Docker({})
  })

  beforeEach(async () => {
    expect(await docker.listContainers()).toHaveLength(0)

    //Do not try to build the images because then timing is really hard
    await dockerCompose('up -d --no-build adapter-db notification-db pipeline-db storage-db')
    await dockerCompose('up -d --no-build storage-db-liquibase')
    await dockerCompose('up -d --no-build adapter notification pipeline scheduler storage storage-mq')
    await dockerCompose('up -d --no-build edge') // Do not start edge with the other services, as then traefik sometime does not get all docker events
    await waitForServicesToBeReady()
  }, TEST_TIMEOUT)

  afterEach(async () => {
    try {
      await writeDockerLogs(dockerCompose, ALL_SERVICES)
    } catch (error) {
      console.log('Failed to save logs', error)
    }

    await dockerCompose('down')
  }, TEST_TIMEOUT)

  test.each(SERVICES_TO_KILL)('%s', async (service, initFn, testFn) => {
    const runningServicesAtStart = (await docker.listContainers()).map(getComposeName).sort()
    expect(runningServicesAtStart).toEqual(ALL_SERVICES)

    //Add some data/state
    if (initFn) {
      await initFn()
    }

    //Kill service
    console.log(`killing ${service}`)
    await dockerCompose(`kill ${service}`)
    console.log(`starting ${service}`)
    await dockerCompose(`start ${service}`)

    await waitForServicesToBeReady()

    //Test
    if (testFn) {
      await testFn()
    }

    //Check if other services are still running
    const runningServicesAfterKill = (await docker.listContainers()).map(getComposeName).sort()
    expect(runningServicesAfterKill).toEqual(runningServicesAtStart)
  }, TEST_TIMEOUT)

  test('rabbitmq', async () => {
    const runningServicesAtStart = (await docker.listContainers()).map(getComposeName).sort()
    expect(runningServicesAtStart).toEqual(ALL_SERVICES)

    const datasourceCreateResponse = await axios.post(`${ADAPTER_URL}/datasources`, {
      protocol: {
        type: 'HTTP',
        parameters: {location: `http://localhost:8080/datasources`, encoding: 'UTF-8'}
      },
      format: {type: 'XML', parameters: {}},
      trigger: {firstExecution: new Date(Date.now() - 1000), periodic: false, interval: 10000},
      metadata: {
        author: 'Test author',
        license: 'none',
        displayName: 'test datasource 1',
        description: 'restart test datasource'
      }
    }, {validateStatus: () => true})
    expect(datasourceCreateResponse.status).toEqual(201)
    const datasourceId = datasourceCreateResponse.data.id

    const pipelineCreateResponse = await axios.post(`${PIPELINE_URL}/configs`, {
      datasourceId,
      transformation: {func: 'return data.item;'},
      metadata: {
        author: 'Test author',
        license: 'none',
        displayName: 'restart test pipeline',
        description: ''
      }
    }, {validateStatus: () => true})
    expect(pipelineCreateResponse.status).toEqual(201)
    const pipelineId = pipelineCreateResponse.data.id

    console.log('killing pipeline so import success event stays in queue')
    await dockerCompose('kill pipeline')

    await sleep(15000) //Wait for import and published import success event

    console.log('killing rabbitmq')
    await dockerCompose('kill rabbitmq')

    console.log('starting rabbitmq and pipeline')
    await dockerCompose('start rabbitmq')
    await sleep(15000)
    await dockerCompose('start pipeline')
    await waitForServicesToBeReady()
    await sleep(10000)

    const storageResponse = await axios.get(`${STORAGE_URL}/${pipelineId}`, {validateStatus: () => true})
    expect(storageResponse.status).toEqual(200)
    expect(storageResponse.data.length).toEqual(1)
    expect(storageResponse.data[0].pipelineId).toEqual(pipelineId)
    expect(storageResponse.data[0].data.metadata.displayName).toEqual('test datasource 1')

    const storageMqResponse = await axios.get(`${STORAGE_MQ_URL}/bucket/${pipelineId}/content`, {validateStatus: () => true})
    expect(storageMqResponse.status).toEqual(200)
    expect(storageMqResponse.data.length).toEqual(1)
    expect(storageMqResponse.data[0].pipelineId).toEqual(pipelineId)
    expect(storageResponse.data[0].data.metadata.displayName).toEqual('test datasource 1')

    const runningServicesAfterKill = (await docker.listContainers()).map(getComposeName).sort()
    expect(runningServicesAfterKill).toEqual(runningServicesAtStart)
  }, TEST_TIMEOUT)
})

async function initAdapter() {
  const response = await axios.post(`${ADAPTER_URL}/datasources`, {
    protocol: {type: 'HTTP', parameters: {location: 'http://www.location.com'}},
    format: {type: 'JSON', parameters: {}},
    trigger: {firstExecution: '1905-12-01T02:30:00.123Z', periodic: false, interval: 50000},
    metadata: {
      author: 'author',
      license: 'none',
      displayName: 'test datasource 1',
      description: 'restart testing datasources'
    }
  }, {validateStatus: () => true})
  expect(response.status).toEqual(201)
}

async function testAdapter() {
  const response = await axios.get(`${ADAPTER_URL}/datasources`, {validateStatus: () => true})
  expect(response.status).toEqual(200)
  expect(response.data.length).toEqual(1)
  expect(response.data[0].metadata.displayName).toEqual('test datasource 1')
}

async function initNotification() {
  const response = await axios.post(`${NOTIFICATION_URL}/configs`, {
    type: 'WEBHOOK',
    pipelineId: 1,
    condition: 'true',
    parameter: {
      url: 'http://test-server/webhook1'
    }
  }, {validateStatus: () => true})
  expect(response.status).toEqual(201)
}

async function testNotification() {
  const response = await axios.get(`${NOTIFICATION_URL}/configs`, {validateStatus: () => true})
  expect(response.status).toEqual(200)
  expect(response.data.length).toEqual(1)
  expect(response.data[0].parameter.url).toEqual('http://test-server/webhook1')
}

async function initPipeline() {
  const response = await axios.post(`${PIPELINE_URL}/configs`, {
    id: 12345,
    datasourceId: 1,
    transformation: {func: 'return data;'},
    metadata: {
      author: 'icke',
      license: 'none',
      displayName: 'restart test pipeline',
      description: ''
    }
  }, {validateStatus: () => true})
  expect(response.status).toEqual(201)
}

async function testPipeline() {
  const response = await axios.get(`${PIPELINE_URL}/configs`, {validateStatus: () => true})
  expect(response.status).toEqual(200)
  expect(response.data.length).toEqual(1)
  expect(response.data[0].metadata.displayName).toEqual('restart test pipeline')
}

async function initStorage() {
  const pipelineId = 42;
  const pipelineName = 'Restart test pipeline'

  expect(await publishEvent('pipeline.config.created', { pipelineId, pipelineName })).toEqual(true)
  await sleep(1000)
  expect(await publishEvent('pipeline.execution.success', { pipelineId, pipelineName, data: { test: true } })).toEqual(true)
  await sleep(1000)

  //storageResponse.data and storageMqResponse.data should be equal but timestamp is serialized differently
  //therefore we can not do: expect(storageResponse.data).toEqual(storageMqResponse.data)
  const storageResponse = await axios.get(`${STORAGE_URL}/${pipelineId}`, {validateStatus: () => true})
  expect(storageResponse.status).toEqual(200)
  expect(storageResponse.data.length).toEqual(1)
  expect(storageResponse.data[0].pipelineId).toEqual(pipelineId)
  expect(storageResponse.data[0].data.test).toEqual(true)

  const storageMqResponse = await axios.get(`${STORAGE_MQ_URL}/bucket/${pipelineId}/content`, {validateStatus: () => true})
  expect(storageMqResponse.status).toEqual(200)
  expect(storageMqResponse.data.length).toEqual(1)
  expect(storageMqResponse.data[0].pipelineId).toEqual(pipelineId)
  expect(storageMqResponse.data[0].data.test).toEqual(true)
}

async function testStorage() {
  const pipelineId = 42;
  const pipelineName = 'Restart test RabbitMQ'

  //Old content is still there
  const storageMqOldResponse = await axios.get(`${STORAGE_URL}/${pipelineId}`, {validateStatus: () => true})
  expect(storageMqOldResponse.status).toEqual(200)
  expect(storageMqOldResponse.data.length).toEqual(1)
  expect(storageMqOldResponse.data[0].pipelineId).toEqual(42)
  expect(storageMqOldResponse.data[0].data.test).toEqual(true)

  expect(await publishEvent('pipeline.execution.success', { pipelineId, pipelineName, data: { test: '123' } })).toEqual(true)
  await sleep(1000)

  const storageMqResponse = await axios.get(`${STORAGE_URL}/${pipelineId}`, {validateStatus: () => true})
  expect(storageMqResponse.status).toEqual(200)
  expect(storageMqResponse.data.length).toEqual(2)
  expect(storageMqResponse.data[0].pipelineId).toEqual(42)
  expect(storageMqResponse.data[0].data.test).toEqual(true)
  expect(storageMqResponse.data[1].pipelineId).toEqual(42)
  expect(storageMqResponse.data[1].data.test).toEqual('123')
}
