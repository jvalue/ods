import { StorageHandler } from './handlers/storageHandler';
import "reflect-metadata";
import { AmqpHandler } from './handlers/amqpHandler';
import { DataEndPoint } from './dataEndpoint';
const port = 8080


const storageHandler = new StorageHandler()
const amqpHandler = new AmqpHandler(storageHandler)

const notificationEndpoint = new DataEndPoint(storageHandler, amqpHandler, port)

notificationEndpoint.listen()
