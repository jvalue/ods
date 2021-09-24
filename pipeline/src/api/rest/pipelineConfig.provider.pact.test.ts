import path from 'path';

import { Verifier } from '@pact-foundation/pact';

import { port, server } from '../../index'; // The main method is automatically called due to this import
import { PipelineConfig } from '../../pipeline-config/model/pipelineConfig';

jest.mock('../../env', () => ({}));

const pipelineConfigs: PipelineConfig[] = [];

jest.mock('../../pipeline-config/pipelineConfigManager', () => {
  return {
    PipelineConfigManager: jest.fn().mockImplementation(() => {
      return {
        getAll: jest.fn().mockResolvedValue(pipelineConfigs),
      };
    }),
  };
});

// The following mocks are needed for propper execution of the main function
jest.mock('../../pipeline-config/pipelineDatabase', () => {
  return {
    init: jest.fn(),
  };
});
jest.mock('@jvalue/node-dry-amqp', () => {
  return {
    AmqpConnection: jest.fn(),
  };
});
jest.mock('../amqp/datasourceExecutionConsumer', () => {
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
      stateHandlers: {
        // eslint-disable-next-line @typescript-eslint/require-await
        'no pipelines registered': async (): Promise<void> => {
          pipelineConfigs.splice(0, pipelineConfigs.length);
        },
      },
    });
    await verifier.verifyProvider().finally(() => {
      server?.close();
    });
  });
});
