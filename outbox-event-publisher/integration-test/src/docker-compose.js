const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

async function DockerCompose(command) {
  return exec(`docker-compose ${command}`)
}

module.exports = {
  DockerCompose
}
