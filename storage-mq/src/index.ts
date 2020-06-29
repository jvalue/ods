

import { StorageHandler } from './handlers/storageHandler';
import "reflect-metadata";
import { AmqpHandler } from './handlers/amqpHandler';
import { DataEndPoint } from './dataEndpoint';
const port = 8080

// authEnabled defaults to false
const authEnabled: boolean = process.env.AUTH_ENABLED === 'true'
if (authEnabled === false) {
  console.warn('WARNING: Authentication is disabled! Make sure this option turned off in production!\n')
}


const storageHandler = new StorageHandler()
const amqpHandler = new AmqpHandler(storageHandler)

const notificationEndpoint = new DataEndPoint(storageHandler, amqpHandler, port, authEnabled)

notificationEndpoint.listen()