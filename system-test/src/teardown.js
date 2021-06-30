
const { DOCKER_COMPOSE_FILES: DOCKER_COMPOSE_FILE, DOCKER_ENV_FILE } = require('./util/env')
const { DockerCompose } = require('./util/docker-compose')

async function teardownTestEnv () {
  const dockerCompose = DockerCompose(DOCKER_COMPOSE_FILE, DOCKER_ENV_FILE)
  await dockerCompose('down')
}

module.exports = teardownTestEnv
