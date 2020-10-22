/* eslint-env jest */
import { mocked } from 'ts-jest/utils'

import ConfigWritesPublisher from './publisher/configWritesPublisher'
import PipelineConfigRepository from './pipelineConfigRepository'
import { PipelineConfigManager } from './pipelineConfigManager'
import PipelineExecutor from '../pipeline-execution/pipelineExecutor'
import { ExecutionResultPublisher } from './publisher/executionResultPublisher'
import { PipelineConfig, PipelineConfigDTO } from './model/pipelineConfig'
import VM2SandboxExecutor from '../pipeline-execution/sandbox/vm2SandboxExecutor'

jest.mock('../pipeline-execution/pipelineExecutor')
const pipelineExecutorMock = mocked(PipelineExecutor, true)
beforeEach(() => {
  pipelineExecutorMock.mockClear()
})

const generateConfig = (): PipelineConfig => {
  return {
    id: 123,
    datasourceId: 456,
    transformation: {
      func: 'return data;'
    },
    metadata: {
      author: 'author',
      displayName: 'Pipeline Test',
      license: 'Test License',
      description: 'A test pipeline.',
      creationTimestamp: new Date()
    }
  }
}

const pipelineConfigDTO = (): PipelineConfigDTO => {
  return {
    datasourceId: 456,
    transformation: {
      func: 'return data;'
    },
    metadata: {
      author: 'author',
      displayName: 'Pipeline Test',
      license: 'Test License',
      description: 'A test pipeline.'
    }
  }
}

const WritesPublisherMock: jest.Mock<ConfigWritesPublisher> = jest.fn(() => ({
  publishCreation: jest.fn().mockReturnValue(true),
  publishUpdate: jest.fn().mockReturnValue(true),
  publishDeletion: jest.fn().mockReturnValue(true)
}))

const ExecutionPublisherMock: jest.Mock<ExecutionResultPublisher> = jest.fn(() => ({
  publishSuccess: jest.fn(),
  publishError: jest.fn()
}))

const RepositoryMock: jest.Mock<PipelineConfigRepository> = jest.fn(() => ({
  create: jest.fn().mockImplementation(async (config) => config),
  get: jest.fn(),
  getAll: jest.fn().mockResolvedValue([generateConfig(), generateConfig()]),
  getByDatasourceId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn().mockResolvedValue(generateConfig()),
  deleteAll: jest.fn().mockResolvedValue([generateConfig(), generateConfig()])
}))

afterEach(() => {
  jest.clearAllMocks()
})

test('Should call create and publish event', async () => {
  const config = pipelineConfigDTO()

  const repositoryMock = new RepositoryMock()
  const writesPublisherMock = new WritesPublisherMock()

  const manager = new PipelineConfigManager(
    repositoryMock,
    new PipelineExecutor(new VM2SandboxExecutor()),
    writesPublisherMock,
    new ExecutionPublisherMock()
  )
  await manager.create(config)

  expect(repositoryMock.create).toHaveBeenCalledWith(config)
  expect(writesPublisherMock.publishCreation).toHaveBeenCalledTimes(1)
})

test('Should call update and publish event', async () => {
  const config = pipelineConfigDTO()

  const repositoryMock = new RepositoryMock()
  const writesPublisherMock = new WritesPublisherMock()

  const manager = new PipelineConfigManager(
    repositoryMock,
    new PipelineExecutor(new VM2SandboxExecutor()),
    writesPublisherMock,
    new ExecutionPublisherMock()
  )
  await manager.update(123, config)

  expect(repositoryMock.update).toHaveBeenCalledWith(123, config)
  expect(writesPublisherMock.publishUpdate).toHaveBeenCalledTimes(1)
})

test('Should call delete and publish event', async () => {
  const repositoryMock = new RepositoryMock()
  const writesPublisherMock = new WritesPublisherMock()

  const manager = new PipelineConfigManager(
    repositoryMock,
    new PipelineExecutor(new VM2SandboxExecutor()),
    writesPublisherMock,
    new ExecutionPublisherMock()
  )
  await manager.delete(1234)

  expect(repositoryMock.delete).toHaveBeenCalledWith(1234)
  expect(writesPublisherMock.publishDeletion).toHaveBeenCalledTimes(1)
})

test('Should call delete all and publish event', async () => {
  const repositoryMock = new RepositoryMock()
  const writesPublisherMock = new WritesPublisherMock()

  const manager = new PipelineConfigManager(
    repositoryMock,
    new PipelineExecutor(new VM2SandboxExecutor()),
    writesPublisherMock,
    new ExecutionPublisherMock()
  )
  await manager.deleteAll()

  expect(repositoryMock.deleteAll).toHaveBeenCalledTimes(1)
  expect(writesPublisherMock.publishDeletion).toHaveBeenCalledTimes(2)
})
