import express, { Application } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import session, { MemoryStore } from 'express-session'

import Keycloak from 'keycloak-connect'

import { TransformationEndpoint } from './transformationEndpoint'
import VM2SandboxExecutor from './vm2SandboxExecutor'
import JSTransformationService from './jsTransformationService'

import { enableSwagger } from './swagger'

const port = 8080

const app: Application = express()
let keycloak = undefined;

app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false }))

// authEnabled defaults to false
const authEnabled: boolean = process.env.AUTH_ENABLED === 'true'
if (authEnabled === false) {
  console.warn('WARNING: Authentication is disabled! Make sure this option turned off in production!\n')
} else {
  const store = new session.MemoryStore()
  keycloak = new Keycloak({ store: store })
  app.use(keycloak.middleware())
}

const sandboxExecutor = new VM2SandboxExecutor()
const transformationService = new JSTransformationService(sandboxExecutor)
const transformationEndpoint = new TransformationEndpoint(transformationService, app, keycloak)

enableSwagger(app)


app.listen(port, () => {
  console.log('listening on port ' + port)
})
