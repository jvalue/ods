import { TransformationEndpoint } from './transformationEndpoint'
import VM2SandboxExecutor from './executors/vm2SandboxExecutor'
import JSTransformationService from './jsTransformationService'
import { AmqpHandler } from './handlers/amqpHandler'
import { StorageHandler } from './handlers/storageHandler';
import "reflect-metadata"

const port = 8080

// authEnabled defaults to false
const authEnabled: boolean = process.env.AUTH_ENABLED === 'true'
if (authEnabled === false) {
  console.warn('WARNING: Authentication is disabled! Make sure this option turned off in production!\n')
}

const sandboxExecutor = new VM2SandboxExecutor()
const transformationService = new JSTransformationService(sandboxExecutor)
const storageHandler = new StorageHandler()
const amqpHandler = new AmqpHandler(storageHandler, transformationService)
const transformationEndpoint = new TransformationEndpoint(transformationService, storageHandler, amqpHandler, port, authEnabled)

transformationEndpoint.listen()
