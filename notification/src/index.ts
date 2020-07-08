import { NotificationEndpoint } from './api/rest/notificationEndpoint';
import VM2SandboxExecutor from './notification-execution/condition-evaluation/vm2SandboxExecutor'
import JSNotificationService from './notification-execution/jsNotificationService'
import { StorageHandler } from './notification-config/storageHandler';
import "reflect-metadata";
import { AmqpHandler } from './api/amqp/amqpHandler';
const port = 8080

// authEnabled defaults to false
const authEnabled: boolean = process.env.AUTH_ENABLED === 'true'
if (authEnabled === false) {
  console.warn('WARNING: Authentication is disabled! Make sure this option turned off in production!\n')
}

const sandboxExecutor = new VM2SandboxExecutor()
const notificationService = new JSNotificationService(sandboxExecutor)
const storageHandler = new StorageHandler()
const amqpHandler = new AmqpHandler(notificationService, storageHandler, sandboxExecutor)

const notificationEndpoint = new NotificationEndpoint(notificationService, storageHandler, amqpHandler, port, authEnabled)

notificationEndpoint.listen()
