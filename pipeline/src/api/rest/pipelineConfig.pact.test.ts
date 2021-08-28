import * as child from 'child_process'
import getPort from 'get-port'
import { Verifier } from '@pact-foundation/pact'
import path from "path"
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { Server } from 'http'
import { PipelineConfigManager } from '../../pipeline-config/pipelineConfigManager'
import { PostgresClient } from '@jvalue/node-dry-pg'
import PipelineExecutor from '../../pipeline-execution/pipelineExecutor'
import { PipelineTransformedDataManager } from '../../pipeline-config/pipelineTransformedDataManager'
import JsonSchemaValidator from '../../pipeline-validator/jsonSchemaValidator'
import { PipelineConfigEndpoint } from './pipelineConfigEndpoint'
import { PipelineConfig } from 'src/pipeline-config/model/pipelineConfig'

// without this mocking, errors due to missing environment variables would occur during test execution
jest.mock('../../pipeline-config/pipelineTransformedDataRepository', () => { })

const pipelineConfigs: PipelineConfig[] = []

jest.mock('../../pipeline-config/pipelineConfigManager', () => {
    return {
        PipelineConfigManager: jest.fn().mockImplementation(() => {
            return {
                getAll: jest.fn().mockResolvedValue(pipelineConfigs),
                // create: jest.fn(),
                // get: jest.fn(),
                // getByDatasourceId: jest.fn(),
                // update: jest.fn(),
                // delete: jest.fn(),
                // deleteAll: jest.fn(),
                // triggerConfig: jest.fn(),
            }
        })
    }
})

jest.mock('@jvalue/node-dry-pg')
const mockPgClient = <jest.Mock<PostgresClient>>PostgresClient

jest.mock('../../pipeline-execution/pipelineExecutor')
const mockPipelineExecutor = <jest.Mock<PipelineExecutor>>PipelineExecutor

jest.mock('../../pipeline-config/pipelineTransformedDataManager')
const mockPipelineTransformedDataManager = <jest.Mock<PipelineTransformedDataManager>>PipelineTransformedDataManager

jest.mock('../../pipeline-validator/jsonSchemaValidator')
const mockValidator = <jest.Mock<JsonSchemaValidator>>JsonSchemaValidator

const gitHash = child.execSync('git rev-parse HEAD').toString().trim()
const gitBranch = child.execSync('git rev-parse --abbrev-ref HEAD').toString().trim()

describe('Pact Provider Verification', () => {

    let port: number
    let server: Server

    beforeEach(async () => {
        port = await getPort()
        const pipelineConfigManager = new PipelineConfigManager(mockPgClient(), mockPipelineExecutor(), mockPipelineTransformedDataManager(), mockValidator())

        // TODO avoid code duplication
        // the following provider startup is an excerpt of the main function in index.ts:
        const pipelineConfigEndpoint = new PipelineConfigEndpoint(pipelineConfigManager)

        const app = express()
        app.use(cors())
        app.use(bodyParser.json({ limit: '50mb' }))
        app.use(bodyParser.urlencoded({ extended: false }))

        pipelineConfigEndpoint.registerRoutes(app)

        server = app.listen(port)
    })

    it('validates the expectations of the UI', async () => {
        const verifier = new Verifier({
            provider: 'Pipeline',
            providerVersion: gitHash,
            providerVersionTags: [gitBranch],
            providerBaseUrl: `http://localhost:${port}`,
            pactUrls: [
                path.resolve(process.cwd(), '..', 'ui', 'pact', 'pacts', 'ui-pipeline.json')
            ],
            stateHandlers: {
                'no pipelines registered': async () => {
                    pipelineConfigs.splice(0, pipelineConfigs.length)
                }
            }
        })
        return verifier.verifyProvider().finally(() => {
            server.close()
        })
    })
})