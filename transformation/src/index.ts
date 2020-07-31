import { TransformationEndpoint } from './api/rest/transformationEndpoint'
import VM2SandboxExecutor from './pipeline-execution/sandbox/vm2SandboxExecutor'
import PipelineExecutor from '@/pipeline-execution/pipelineExecutor'

const port = 8080

// authEnabled defaults to false
const authEnabled: boolean = process.env.AUTH_ENABLED === 'true'
if (authEnabled === false) {
  console.warn('WARNING: Authentication is disabled! Make sure this option turned off in production!\n')
}

const sandboxExecutor = new VM2SandboxExecutor()
const transformationService = new PipelineExecutor(sandboxExecutor)
const transformationEndpoint = new TransformationEndpoint(transformationService, port, authEnabled)

transformationEndpoint.listen()
