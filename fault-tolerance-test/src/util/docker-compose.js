const fs = require('fs')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

const LOGS_DIRECTORY = 'logs'

function DockerCompose (composeFiles, envFile) {
  if (!Array.isArray(composeFiles)) {
    composeFiles = [composeFiles]
  }
  const composeFilesString = composeFiles.map(file => `-f ${file}`).join(' ')
  return async command => await exec(`docker-compose ${composeFilesString} --env-file ${envFile} ${command}`)
}

async function writeDockerLogs (dockerComposeFn, services) {
  const escapedTestName = expect.getState().currentTestName.split(' ').join('_')
  const logFile = `${LOGS_DIRECTORY}/${escapedTestName}.log`
  if (!fs.existsSync(LOGS_DIRECTORY)) {
    fs.mkdirSync(LOGS_DIRECTORY)
  }
  const fd = fs.openSync(logFile, 'w')
  for (const service of services) {
    const logs = await dockerComposeFn(`logs --no-color ${service}`)
    fs.writeSync(fd, logs.stdout)
  }
  fs.closeSync(fd)
}

module.exports = {
  DockerCompose,
  writeDockerLogs
}
