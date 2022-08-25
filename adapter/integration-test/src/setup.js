const { DOCKER_COMPOSE_FILES, DOCKER_ENV_FILE } = require('./util/env')
const { DockerCompose, areAllContainersDown } = require('./util/docker-compose')
const { waitForServicesToBeReady } = require('./util/waitForServices')

async function setupTestEnv () {
  console.log('')
  console.log('Setting up test environment. Make sure docker compose is installed.')
  console.log('Note: Changes in the mock server require a manual rebuild of the image!')
  console.log('')

  const dockerCompose = DockerCompose(DOCKER_COMPOSE_FILES, DOCKER_ENV_FILE)

  if (await !areAllContainersDown(dockerCompose)) {
    throw Error('Can not execute restart test if other containers are running')
  }

  await dockerCompose('build adapter')

  // Do not try to build the images because then timing is really hard
  await dockerCompose('up -d mock-server')
  await dockerCompose('up -d --no-build adapter-db')
  await dockerCompose('up -d --no-build rabbitmq')
  await dockerCompose('up -d --no-build adapter')
  await dockerCompose('up -d --no-build edge')
  await waitForServicesToBeReady()
}

module.exports = setupTestEnv
