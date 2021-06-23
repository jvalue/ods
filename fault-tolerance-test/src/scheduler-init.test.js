const { setTimeout: sleep } = require('timers/promises')

const { DOCKER_COMPOSE_FILE, ENV_FILE, SCHEDULER_URL } = require('./util/env')
const { DockerCompose, writeDockerLogs } = require('./util/docker-compose')
const { waitForServicesToBeReady } = require('./util/waitForServices')
const http = require('./util/http')

const SECOND = 1000
const MINUTE = 60 * SECOND
const TEST_TIMEOUT = 3 * MINUTE

describe('Scheduler test', () => {
  let dockerCompose
  beforeAll(async () => {
    dockerCompose = DockerCompose([DOCKER_COMPOSE_FILE, './docker-compose.scheduler-init.yml'], ENV_FILE)
    await dockerCompose('build fake-adapter')
  }, TEST_TIMEOUT)

  afterEach(async () => {
    try {
      await writeDockerLogs(dockerCompose, ['scheduler', 'fake-adapter'])
    } catch (error) {
      console.log('Failed to save logs', error)
    }

    await dockerCompose('down')
  }, TEST_TIMEOUT)

  test('initialization', async () => {
    await dockerCompose('up -d --no-build rabbitmq fake-adapter')
    await dockerCompose('up -d --no-build scheduler')
    await dockerCompose('up -d --no-build edge')
    await waitForServicesToBeReady([SCHEDULER_URL])

    await sleep(1000)

    const jobs = await http.get(`${SCHEDULER_URL}/jobs`, 200)
    expect(jobs).toHaveLength(0)
  }, TEST_TIMEOUT)
})
