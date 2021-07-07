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
  const escapedTestName = expect.getState().currentTestName.split(/,| |:/).join('_')
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

async function areAllContainersDown (dockerComposeFn) {
  const dockerPsResult = await dockerComposeFn('ps')
  const resultMessage = dockerPsResult.stdout
  const resultLines = resultMessage.split('\n').length
  // 1st line = header col; 2nd line = separator; 3rd line empty (trailnig '\n'); then the running containers follow
  return resultLines <= 3
}

module.exports = {
  DockerCompose,
  writeDockerLogs,
  areAllContainersDown
}
