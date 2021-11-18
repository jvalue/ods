import path from 'path';

import { Verifier } from '@pact-foundation/pact';

import {
  HealthStatus,
  PipelineConfig,
  PipelineConfigDTO,
} from './pipeline-config/model/pipelineConfig';
import { PipelineTransformedData } from './pipeline-config/model/pipelineTransformedData';

import { port, server } from './index'; // The main method is automatically called due to this import

const pipelineConfigs: PipelineConfig[] = [];
let nextPipelineConfigId: number;

jest.mock('./pipeline-config/pipelineConfigManager', () => {
  return {
    PipelineConfigManager: jest.fn().mockImplementation(() => {
      return {
        getAll: jest.fn().mockResolvedValue(pipelineConfigs),

        get: jest.fn().mockImplementation(async (id: number) => {
          const result = pipelineConfigs.find((config) => config.id === id);
          return Promise.resolve(result);
        }),

        getByDatasourceId: jest
          .fn()
          .mockImplementation(async (datasourceId: number) => {
            const result = pipelineConfigs.filter(
              (config) => config.datasourceId === datasourceId,
            );
            return Promise.resolve(result);
          }),

        create: jest
          .fn()
          .mockImplementation(async (config: PipelineConfigDTO) => {
            const result: PipelineConfig = {
              ...config,
              metadata: {
                ...config.metadata,
                creationTimestamp: new Date(2022, 1),
              },
              id: ++nextPipelineConfigId,
            };
            pipelineConfigs.push(result);
            return await Promise.resolve(result);
          }),

        update: jest.fn((id: number, config: PipelineConfigDTO) => {
          const configToUpdate = pipelineConfigs.find(
            (config) => config.id === id,
          );
          Object.assign(configToUpdate, config);
        }),

        delete: jest.fn((id: number) => {
          const indexOfConfigToDelete = pipelineConfigs.findIndex(
            (config) => config.id === id,
          );
          if (indexOfConfigToDelete !== -1) {
            pipelineConfigs.splice(indexOfConfigToDelete, 1);
          }
        }),
      };
    }),
  };
});

const pipelineTransformedData: PipelineTransformedData[] = [];

jest.mock('./pipeline-config/pipelineTransformedDataManager', () => {
  return {
    PipelineTransformedDataManager: jest.fn().mockImplementation(() => {
      return {
        getLatest: jest.fn(async (id: number) => {
          const result = pipelineTransformedData.find((data) => data.id === id);
          return Promise.resolve(result);
        }),
      };
    }),
  };
});

// The following mocks are needed for propper execution of the main function
jest.mock('./pipeline-config/pipelineDatabase', () => {
  return {
    init: jest.fn(),
  };
});
jest.mock('@jvalue/node-dry-amqp', () => {
  return {
    AmqpConnection: jest.fn(),
  };
});
jest.mock('./api/amqp/datasourceExecutionConsumer', () => {
  return {
    createDatasourceExecutionConsumer: jest.fn(),
  };
});

describe('Pact Provider Verification', () => {
  it('validates the expectations of the UI', async () => {
    const verifier = new Verifier({
      provider: 'Pipeline',
      providerBaseUrl: `http://localhost:${port}`,
      pactUrls: [
        path.resolve(process.cwd(), '..', 'pacts', 'ui-pipeline.json'),
      ],
      logDir: path.resolve(process.cwd(), '..', 'pacts', 'logs'),
      stateHandlers: {
        'any state': setupEmptyState,
        'no pipelines exist': setupEmptyState,
        'some pipelines without schemas exist':
          setupSomePipelineConfigsWithoutSchemas,
        'some pipelines with schemas exist':
          setupSomePipelineConfigsWithSchemas,
        'pipeline with id 1 exists': setupSomePipelineConfigsWithoutSchemas,
        'pipeline with id 1 exists and has no schema':
          setupSomePipelineConfigsWithoutSchemas,
        'pipeline with id 1 exists and has a schema':
          setupSomePipelineConfigsWithSchemas,
        'pipeline with id 1 does not exist': setupEmptyState,
        'pipelines with datasource id 2 exist and have schemas':
          setupSomePipelineConfigsWithSchemas,
        'pipelines with datasource id 2 exist and have no schemas':
          setupSomePipelineConfigsWithoutSchemas,
        'pipelines with datasource id 2 do not exist': setupEmptyState,
        'transformed data with id 1 and health status OK exists':
          async (): Promise<void> =>
            setupSomePipelineTransformedData(HealthStatus.OK),
        'transformed data with id 1 and health status WARNING exists':
          async (): Promise<void> =>
            setupSomePipelineTransformedData(HealthStatus.WARNING),
        'transformed data with id 1 and health status FAILED exists':
          async (): Promise<void> =>
            setupSomePipelineTransformedData(HealthStatus.FAILED),
        'transformed data with id 1 does not exist': setupEmptyState,
      },
    });
    await verifier.verifyProvider().finally(() => {
      server?.close();
    });
  });
});

async function setupEmptyState(): Promise<void> {
  clearState();

  return Promise.resolve();
}

async function setupSomePipelineConfigsWithoutSchemas(): Promise<void> {
  await setupSomePipelineConfigs(false);
}

async function setupSomePipelineConfigsWithSchemas(): Promise<void> {
  await setupSomePipelineConfigs(true);
}

async function setupSomePipelineConfigs(withSchemas: boolean): Promise<void> {
  clearState();
  addSamplePipelineConfig(2, withSchemas);
  addSamplePipelineConfig(3, withSchemas);
  addSamplePipelineConfig(2, withSchemas);

  return Promise.resolve();
}

async function setupSomePipelineTransformedData(
  healthStatus: HealthStatus,
): Promise<void> {
  clearState();
  addSamplePipelineTransformedData(1, healthStatus);
  addSamplePipelineTransformedData(2, healthStatus);

  return Promise.resolve();
}

function clearState(): void {
  nextPipelineConfigId = 0;
  clearPipelineConfigs();

  clearPipelineTransformedData();
}

function clearPipelineConfigs(): void {
  pipelineConfigs.splice(0, pipelineConfigs.length);
}

function addSamplePipelineConfig(
  datasourceId: number,
  withSchema: boolean,
): void {
  const pipelineConfig: PipelineConfig = {
    id: ++nextPipelineConfigId,
    datasourceId: datasourceId,
    metadata: {
      author: 'some author',
      description: 'some description',
      displayName: 'some display name',
      license: 'some license',
      creationTimestamp: new Date(2021, 5),
    },
    transformation: {
      func: 'some function',
    },
  };
  if (withSchema) {
    pipelineConfig.schema = {};
  }
  pipelineConfigs.push(pipelineConfig);
}

function clearPipelineTransformedData(): void {
  pipelineTransformedData.splice(0, pipelineTransformedData.length);
}

function addSamplePipelineTransformedData(
  id: number,
  healthStatus: HealthStatus,
): void {
  const data: PipelineTransformedData = {
    id: id,
    pipelineId: 42,
    healthStatus: healthStatus,
    data: {},
  };
  pipelineTransformedData.push(data);
}
