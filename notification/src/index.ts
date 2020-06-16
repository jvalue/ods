import { NotificationEndpoint } from './notificationEndpoint';
import VM2SandboxExecutor from './vm2SandboxExecutor'
import JSNotificationService from './jsNotificationService'
import { StorageHandler } from './handlers/storageHandler';
import "reflect-metadata";
import { AmqpHandler } from './handlers/amqpHandler';
const port = 8080

// authEnabled defaults to false
const authEnabled: boolean = process.env.AUTH_ENABLED === 'true'
if (authEnabled === false) {
  console.warn('WARNING: Authentication is disabled! Make sure this option turned off in production!\n')
}

const sandboxExecutor = new VM2SandboxExecutor()
const notificationService = new JSNotificationService(sandboxExecutor)
const storageHandler = new StorageHandler()
const amqpHandler = new AmqpHandler()

const notificationEndpoint = new NotificationEndpoint(notificationService, storageHandler, amqpHandler, port, authEnabled)

notificationEndpoint.listen()
