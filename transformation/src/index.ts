import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import { PipelineExecutionEndpoint } from '@/api/rest/pipelineExecutionEndpoint'
import VM2SandboxExecutor from '@/pipeline-execution/sandbox/vm2SandboxExecutor'
import PipelineExecutor from '@/pipeline-execution/pipelineExecutor'
const port = 8080

const app = express()

app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false }))

const sandboxExecutor = new VM2SandboxExecutor()
const pipelineExecutor = new PipelineExecutor(sandboxExecutor)

// global promise-rejected handler
process.on('unhandledRejection', function(reason, p){
  console.debug("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
});


const server = app.listen(port, async () => {
  console.log('Listening on port ' + port)

  const pipelineExecutionEndpoint = new PipelineExecutionEndpoint(pipelineExecutor, app)

  app.get("/", (req: express.Request, res: express.Response): void => {
    res.status(200)
        .send('I am alive!')
  })

  app.get("/version", (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain')
    res.status(200)
        .send(pipelineExecutor.getVersion())
    res.end()
  })
})

process.on('SIGTERM', async () => {
  console.info('Tramsformation-Service: SIGTERM signal received.')
  await server.close()
})


