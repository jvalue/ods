
const { DOCKER_COMPOSE_FILES, DOCKER_ENV_FILE } = require('./util/env')
const { DockerCompose } = require('./util/docker-compose')
const fs = require('fs')

async function teardownTestEnv () {
  console.log('')
  console.log('Tearing down test environment...')
  console.log('')

  const dockerCompose = DockerCompose(DOCKER_COMPOSE_FILES, DOCKER_ENV_FILE)

  const logFile = 'integration-test.log'
  const logs = await dockerCompose('logs')
  fs.writeFileSync(logFile, logs.stdout)
  console.log(`Logs of containers in "${logFile}"`)

  await dockerCompose('down')
}

module.exports = teardownTestEnv
