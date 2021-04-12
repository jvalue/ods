const Docker = require('dockerode')
const { sleep } = require('@jvalue/node-dry-basics')

const { PIPELINE_URL, STORAGE_URL, DOCKER_COMPOSE_FILE, ENV_FILE } = require('./util/env')
const { DockerCompose, writeDockerLogs } = require('./util/docker-compose')
const { waitForServicesToBeReady } = require('./util/waitForServices')
const { publishEvent } = require('./util/amqp')
const http = require('./util/http')

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
  // 'storage-db-liquibase', //Only creates the database schema and then exits, therefore ignore
  'storage-mq'
].sort()

describe('Scaling test', () => {
  let dockerCompose
  let docker

  beforeAll(() => {
    dockerCompose = DockerCompose(DOCKER_COMPOSE_FILE, ENV_FILE)
    docker = new Docker({})
  })

  beforeEach(async () => {
    if ((await docker.listContainers()).length !== 0) {
      throw Error('Can not execute restart test if other containers are running')
    }

    // Do not try to build the images because then timing is really hard
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

  test('event is only consumed by one instance', async () => {
    const datasourceId = 1

    await dockerCompose('up -d --scale pipeline=2 pipeline')

    // Create pipeline
    const { id: pipelineId } = await http.post(`${PIPELINE_URL}/configs`, {
      datasourceId,
      transformation: { func: 'return data;' },
      metadata: {
        author: 'Test pipeline',
        license: 'none',
        displayName: 'restart test pipeline',
        description: ''
      }
    }, 201)
    await sleep(5000)

    // Publish import success event, so pipeline is executed
    expect(await publishEvent('datasource.execution.success', { datasourceId, data: '{ "test": "I am some test data" }' })).toEqual(true)
    await sleep(5000)

    const storageContent = await http.get(`${STORAGE_URL}/${pipelineId}`, 200)
    expect(storageContent).toHaveLength(1)
    expect(storageContent[0].pipelineId).toEqual(pipelineId)
    expect(storageContent[0].data.test).toEqual('I am some test data')
  }, TEST_TIMEOUT)

  test('requests are shifted to the running instances', async () => {
    await dockerCompose('up -d --scale pipeline=2 pipeline')
    await sleep(2000)

    // Create pipeline
    const { id: pipelineId } = await http.post(`${PIPELINE_URL}/configs`, {
      datasourceId: 1,
      transformation: { func: 'return data;' },
      metadata: {
        author: 'Test pipeline',
        license: 'none',
        displayName: 'restart test pipeline',
        description: ''
      }
    }, 201)

    const container1 = docker.getContainer('open-data-service_pipeline_1')
    const container2 = docker.getContainer('open-data-service_pipeline_2')

    await http.get(`${PIPELINE_URL}/configs/${pipelineId}`, 200)
    await http.get(`${PIPELINE_URL}/configs/${pipelineId}`, 200)

    await container1.kill()
    console.log('container1 killed')
    await sleep(2000)

    await http.get(`${PIPELINE_URL}/configs/${pipelineId}`, 200)
    await http.get(`${PIPELINE_URL}/configs/${pipelineId}`, 200)

    await dockerCompose('up -d --scale pipeline=2 pipeline')
    console.log('container1 started')
    await sleep(2000)

    await http.get(`${PIPELINE_URL}/configs/${pipelineId}`, 200)
    await http.get(`${PIPELINE_URL}/configs/${pipelineId}`, 200)

    await container2.kill()
    console.log('container2 killed')
    await sleep(2000)

    await http.get(`${PIPELINE_URL}/configs/${pipelineId}`, 200)
    await http.get(`${PIPELINE_URL}/configs/${pipelineId}`, 200)
  }, TEST_TIMEOUT)
})
