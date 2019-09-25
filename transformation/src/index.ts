
import bodyParser from 'body-parser'
import express, { Request, Response } from 'express'
import session from 'express-session'
import cors from 'cors'
import { execute } from './sandbox'
import Keycloak from 'keycloak-connect'
import TransformationRequest from './interfaces/transformationRequest'
import { NotificationRequest } from './interfaces/notificationRequest'
import { handleNotification } from './notifications'

const memoryStore = new session.MemoryStore()

const app = express()
const port = 8080
const API_VERSION = '0.0.1'

const AUTH_ENABLED: boolean = process.env.AUTH_ENABLED !== 'false'

app.use(cors())

const keycloak = AUTH_ENABLED ? new Keycloak({ store: memoryStore }) : undefined
if (keycloak !== undefined) {
  console.warn('WARNING: Authentication is disabled! Make sure this option turned off in production!\n')
  app.use(keycloak.middleware())
}

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false }))

app.listen(port, () => {
  console.log('listening on port ' + port)
})

app.get('/', (req, res) => {
  res.send('I am alive!')
})

app.get('/version', (req, res) => {
  res.header('Content-Type', 'text/plain')
  res.send(API_VERSION)
})

app.post('/job', determineAuth(), (req: Request, res: Response) => {
  const transformation: TransformationRequest = req.body
  const answer = '' + execute(transformation.func, transformation.data)
  res.setHeader('Content-Type', 'application/json')
  res.writeHead(200)
  res.write(answer)
  res.end()
})

app.post('/notification', determineAuth(), (req: Request, res: Response) => {
  const notification: NotificationRequest = req.body

  handleNotification(notification) // Result of notification handling is ignored for now.

  res.status(202).send()
})

function determineAuth (): express.RequestHandler | [] {
  if (keycloak !== undefined) {
    return keycloak.protect()
  } else {
    return []
  }
}
