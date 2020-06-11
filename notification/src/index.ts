import { NotificationEndpoint } from './notificationEndpoint';
import VM2SandboxExecutor from './vm2SandboxExecutor'
import JSNotificationService from './jsNotificationService'
import { StorageHandler } from './storageHandler';
import "reflect-metadata";
import { Connection, createConnection } from 'typeorm';

const port = 8080

// authEnabled defaults to false
const authEnabled: boolean = process.env.AUTH_ENABLED === 'true'
if (authEnabled === false) {
  console.warn('WARNING: Authentication is disabled! Make sure this option turned off in production!\n')
}

const sandboxExecutor = new VM2SandboxExecutor()
const notificationService = new JSNotificationService(sandboxExecutor)
const storageHandler = new StorageHandler()

const notificationEndpoint = new NotificationEndpoint(notificationService, storageHandler, port, authEnabled)

notificationEndpoint.listen()
