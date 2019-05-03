// @ts-check

const bodyParser = require('body-parser')
const express = require('express')
const session = require('express-session')
const cors = require('cors')
const sandbox = require('./sandbox')
const Keycloak = require('keycloak-connect')

const memoryStore = new session.MemoryStore()

const app = express()
const port = 4000
const keycloak = new Keycloak({ store: memoryStore })

app.use(cors())
app.use(keycloak.middleware())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.listen(port, () => {
  console.log('listening on port ' + port)
})

app.post('/job', keycloak.protect(), (req, res) => {
  let answer = '' + sandbox.execute(req.body.func, req.body.data)
  res.setHeader('Content-Type', 'application/json')
  res.writeHead(200)
  res.write(answer)
  res.end()
})
