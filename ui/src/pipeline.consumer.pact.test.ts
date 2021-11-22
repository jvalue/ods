import path from 'path';

import { JestPactOptions, pactWith } from 'jest-pact';

import {
  badRequestResponse,
  createRequest,
  createRequestTitle,
  createSuccessResponse,
  deleteRequest,
  deleteRequestTitle,
  deleteSuccessResponse,
  exampleDatasourceId,
  exampleErrorThrownJobResult,
  exampleInvalidSyntaxJobResult,
  examplePipelineId,
  examplePipelineWithSchema,
  examplePipelineWithoutSchema,
  exampleSuccessJobResult,
  exampleTransformationRequestWithErrorThrowingFunction,
  exampleTransformationRequestWithInvalidSyntax,
  exampleTransformedDataId,
  exampleValidTransformationRequest,
  getAllEmptyResponse,
  getAllRequest,
  getAllRequestTitle,
  getAllSuccessResponse,
  getByDatasourceIdEmptyResponse,
  getByDatasourceIdRequest,
  getByDatasourceIdRequestTitle,
  getByDatasourceIdSuccessResponse,
  getByIdRequest,
  getByIdRequestTitle,
  getByIdSuccessResponse,
  getLatestTransformedDataRequest,
  getLatestTransformedDataRequestTitle,
  getLatestTransformedDataSuccessResponse,
  noContentResponse,
  notFoundResponse,
  transformDataErrorThrownResponse,
  transformDataInvalidSyntaxResponse,
  transformDataRequest,
  transformDataSuccessResponse,
  updateRequest,
  updateRequestTitle,
  updateSuccessResponse,
} from './pipeline.consumer.pact.fixtures';
import { TransformationRest } from './pipeline/edit/transformation/transformationRest';
import { HealthStatus } from './pipeline/pipeline';
import { PipelineRest } from './pipeline/pipelineRest';
import { PipelineTransRest } from './pipeline/pipelineTransRest';

const options: JestPactOptions = {
  consumer: 'UI',
  provider: 'Pipeline',
  dir: path.resolve(process.cwd(), '..', 'pacts'),
  logDir: path.resolve(process.cwd(), '..', 'pacts', 'logs'),
  pactfileWriteMode: 'overwrite',
};

pactWith(options, provider => {
  let restService: PipelineRest;

  describe('using pipeline rest', () => {
    beforeAll(() => {
      const pipelineServiceUrl = provider.mockService.baseUrl;
      restService = new PipelineRest(pipelineServiceUrl);
    });

    describe('getting all pipelines', () => {
      describe('when some pipelines without schemas exist', () => {
        beforeEach(async () => {
          await provider.addInteraction({
            state: 'some pipelines without schemas exist',
            uponReceiving: getAllRequestTitle,
            withRequest: getAllRequest,
            willRespondWith: getAllSuccessResponse(false),
          });
        });

        it('returns a non-empty pipeline array', async () => {
          const pipelines = await restService.getAllPipelines();

          expect(pipelines).toStrictEqual([examplePipelineWithoutSchema]);
        });
      });

      describe('when some pipelines with schemas exist', () => {
        beforeEach(async () => {
          await provider.addInteraction({
            state: 'some pipelines with schemas exist',
            uponReceiving: getAllRequestTitle,
            withRequest: getAllRequest,
            willRespondWith: getAllSuccessResponse(true),
          });
        });

        it('returns a non-empty pipeline array', async () => {
          const pipelines = await restService.getAllPipelines();

          expect(pipelines).toStrictEqual([examplePipelineWithSchema]);
        });
      });

      describe('when no pipelines exist', () => {
        beforeEach(async () => {
          await provider.addInteraction({
            state: 'no pipelines exist',
            uponReceiving: getAllRequestTitle,
            withRequest: getAllRequest,
            willRespondWith: getAllEmptyResponse,
          });
        });

        it('returns an empty pipeline array', async () => {
          const pipelines = await restService.getAllPipelines();

          expect(pipelines).toStrictEqual([]);
        });
      });
    });

    describe('getting a pipeline by id', () => {
      describe('when the requested pipeline exists and has no schema', () => {
        const id = examplePipelineId;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipeline with id ${id} exists and has no schema`,
            uponReceiving: getByIdRequestTitle(id),
            withRequest: getByIdRequest(id),
            willRespondWith: getByIdSuccessResponse(false),
          });
        });

        it('returns the requested pipeline', async () => {
          const pipeline = await restService.getPipelineById(id);

          expect(pipeline).toStrictEqual(examplePipelineWithoutSchema);
        });
      });

      describe('when the requested pipeline exists and has a schema', () => {
        const id = examplePipelineId;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipeline with id ${id} exists and has a schema`,
            uponReceiving: getByIdRequestTitle(id),
            withRequest: getByIdRequest(id),
            willRespondWith: getByIdSuccessResponse(true),
          });
        });

        it('returns the requested pipeline', async () => {
          const pipeline = await restService.getPipelineById(id);

          expect(pipeline).toStrictEqual(examplePipelineWithSchema);
        });
      });

      describe('when the requested pipeline does not exist', () => {
        const id = examplePipelineId;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipeline with id ${id} does not exist`,
            uponReceiving: getByIdRequestTitle(id),
            withRequest: getByIdRequest(id),
            willRespondWith: notFoundResponse,
          });
        });

        it('throws an error', async () => {
          await expect(restService.getPipelineById(id)).rejects.toThrow(Error);
        });
      });

      describe('with NaN as requested id', () => {
        beforeEach(async () => {
          await provider.addInteraction({
            state: 'any state',
            uponReceiving: getByIdRequestTitle(NaN),
            withRequest: getByIdRequest(NaN),
            willRespondWith: badRequestResponse,
          });
        });

        it('throws an error', async () => {
          await expect(restService.getPipelineById(NaN)).rejects.toThrow(Error);
        });
      });
    });

    describe('getting pipelines by datasource id', () => {
      describe('when pipelines with the requested datasource id exist and have no schemas', () => {
        const id = exampleDatasourceId;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipelines with datasource id ${id} exist and have no schemas`,
            uponReceiving: getByDatasourceIdRequestTitle(id),
            withRequest: getByDatasourceIdRequest(id),
            willRespondWith: getByDatasourceIdSuccessResponse(false),
          });
        });

        it('returns the requested pipelines', async () => {
          const pipelines = await restService.getPipelinesByDatasourceId(id);

          expect(pipelines).toStrictEqual([examplePipelineWithoutSchema]);
        });
      });

      describe('when pipelines with the requested datasource id exist and have schemas', () => {
        const id = exampleDatasourceId;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipelines with datasource id ${id} exist and have schemas`,
            uponReceiving: getByDatasourceIdRequestTitle(id),
            withRequest: getByDatasourceIdRequest(id),
            willRespondWith: getByDatasourceIdSuccessResponse(true),
          });
        });

        it('returns the requested pipelines', async () => {
          const pipelines = await restService.getPipelinesByDatasourceId(id);

          expect(pipelines).toStrictEqual([examplePipelineWithSchema]);
        });
      });

      describe('when no pipelines with the requested datasource id exist', () => {
        const id = exampleDatasourceId;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipelines with datasource id ${id} do not exist`,
            uponReceiving: getByDatasourceIdRequestTitle(id),
            withRequest: getByDatasourceIdRequest(id),
            willRespondWith: getByDatasourceIdEmptyResponse,
          });
        });

        it('returns an empty pipeline array', async () => {
          const pipelines = await restService.getPipelinesByDatasourceId(id);

          expect(pipelines).toStrictEqual([]);
        });
      });

      describe('with NaN as requested datasource id', () => {
        beforeEach(async () => {
          await provider.addInteraction({
            state: 'any state',
            uponReceiving: getByDatasourceIdRequestTitle(NaN),
            withRequest: getByDatasourceIdRequest(NaN),
            willRespondWith: badRequestResponse,
          });
        });

        it('throws an error', async () => {
          await expect(
            restService.getPipelinesByDatasourceId(NaN),
          ).rejects.toThrow(Error);
        });
      });
    });

    describe('creating a pipeline', () => {
      describe('that has no schema', () => {
        const pipeline = examplePipelineWithoutSchema;

        beforeEach(async () => {
          await provider.addInteraction({
            state: 'any state',
            uponReceiving: createRequestTitle(false),
            withRequest: createRequest(pipeline),
            willRespondWith: createSuccessResponse(pipeline),
          });
        });

        it('returns the created pipeline', async () => {
          const createdPipeline = await restService.createPipeline(pipeline);

          const expectedPipeline = {
            ...pipeline,
            id: createdPipeline.id,
          };
          expect(createdPipeline).toStrictEqual(expectedPipeline);
        });
      });

      describe('that has a schema', () => {
        const pipeline = examplePipelineWithSchema;

        beforeEach(async () => {
          await provider.addInteraction({
            state: 'any state',
            uponReceiving: createRequestTitle(true),
            withRequest: createRequest(pipeline),
            willRespondWith: createSuccessResponse(pipeline),
          });
        });

        it('returns the created pipeline', async () => {
          const createdPipeline = await restService.createPipeline(pipeline);

          const expectedPipeline = {
            ...pipeline,
            id: createdPipeline.id,
          };
          expect(createdPipeline).toStrictEqual(expectedPipeline);
        });
      });
    });

    describe('updating a pipeline', () => {
      describe('when the pipeline to update exists and its schema is not updated', () => {
        const pipeline = examplePipelineWithoutSchema;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipeline with id ${pipeline.id} exists`,
            uponReceiving: updateRequestTitle(pipeline.id, false),
            withRequest: updateRequest(pipeline),
            willRespondWith: updateSuccessResponse(false),
          });
        });

        it('succeeds', async () => {
          await restService.updatePipeline(pipeline);
        });
      });

      describe('when the pipeline to update exists and its schema is updated', () => {
        const pipeline = examplePipelineWithSchema;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipeline with id ${pipeline.id} exists`,
            uponReceiving: updateRequestTitle(pipeline.id, true),
            withRequest: updateRequest(pipeline),
            willRespondWith: updateSuccessResponse(true),
          });
        });

        it('returns the updated pipeline', async () => {
          const updatedPipeline = await restService.updatePipeline(pipeline);

          expect(updatedPipeline).toStrictEqual(pipeline);
        });
      });

      describe('when the pipeline to update does not exist', () => {
        const pipeline = examplePipelineWithoutSchema;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipeline with id ${pipeline.id} does not exist`,
            uponReceiving: updateRequestTitle(pipeline.id, false),
            withRequest: updateRequest(pipeline),
            willRespondWith: notFoundResponse,
          });
        });

        it('throws an error', async () => {
          await expect(restService.updatePipeline(pipeline)).rejects.toThrow(
            Error,
          );
        });
      });

      describe('with NaN as id for the pipline to update', () => {
        const pipeline = {
          ...examplePipelineWithoutSchema,
          id: NaN,
        };

        beforeEach(async () => {
          await provider.addInteraction({
            state: 'any state',
            uponReceiving: updateRequestTitle(pipeline.id, false),
            withRequest: updateRequest(pipeline),
            willRespondWith: badRequestResponse,
          });
        });

        it('throws an error', async () => {
          await expect(restService.updatePipeline(pipeline)).rejects.toThrow(
            Error,
          );
        });
      });
    });

    describe('deleting a pipeline', () => {
      describe('when the pipeline to delete exists and has no schema', () => {
        const pipeline = examplePipelineWithoutSchema;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipeline with id ${pipeline.id} exists and has no schema`,
            uponReceiving: deleteRequestTitle(pipeline.id),
            withRequest: deleteRequest(pipeline.id),
            willRespondWith: deleteSuccessResponse(false),
          });
        });

        it('returns the deleted pipeline', async () => {
          const deletedPipeline = await restService.deletePipeline(pipeline.id);

          expect(deletedPipeline).toStrictEqual(pipeline);
        });
      });

      describe('when the pipeline to delete exists and has a schema', () => {
        const pipeline = examplePipelineWithSchema;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipeline with id ${pipeline.id} exists and has a schema`,
            uponReceiving: deleteRequestTitle(pipeline.id),
            withRequest: deleteRequest(pipeline.id),
            willRespondWith: deleteSuccessResponse(true),
          });
        });

        it('returns the deleted pipeline', async () => {
          const deletedPipeline = await restService.deletePipeline(pipeline.id);

          expect(deletedPipeline).toStrictEqual(pipeline);
        });
      });

      describe('when the pipeline to delete does not exist', () => {
        const id = examplePipelineId;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipeline with id ${id} does not exist`,
            uponReceiving: deleteRequestTitle(id),
            withRequest: deleteRequest(id),
            willRespondWith: noContentResponse,
          });
        });

        it('returns undefined', async () => {
          expect(await restService.deletePipeline(id)).toBeUndefined();
        });
      });

      describe('with NaN as id for the pipline to delete', () => {
        beforeEach(async () => {
          await provider.addInteraction({
            state: 'any state',
            uponReceiving: deleteRequestTitle(NaN),
            withRequest: deleteRequest(NaN),
            willRespondWith: badRequestResponse,
          });
        });

        it('throws an error', async () => {
          await expect(restService.deletePipeline(NaN)).rejects.toThrow(Error);
        });
      });
    });
  });

  describe('using pipeline transformed data rest', () => {
    let restService: PipelineTransRest;

    beforeAll(() => {
      const pipelineServiceUrl = provider.mockService.baseUrl;
      restService = new PipelineTransRest(pipelineServiceUrl);
    });

    describe('getting latest transformed data', () => {
      describe('when the requested transformed data exists', () => {
        const id = exampleTransformedDataId;

        // eslint-disable-next-line guard-for-in
        for (const healthStatusKey in HealthStatus) {
          const healthStatus =
            HealthStatus[healthStatusKey as keyof typeof HealthStatus];

          describe(`with health status ${healthStatus}`, () => {
            beforeEach(async () => {
              await provider.addInteraction({
                state: `transformed data with id ${id} and health status ${healthStatus} exists`,
                uponReceiving: getLatestTransformedDataRequestTitle(id),
                withRequest: getLatestTransformedDataRequest(id),
                willRespondWith: getLatestTransformedDataSuccessResponse(
                  healthStatus,
                ),
              });
            });

            it('returns the requested transformed data', async () => {
              const transformedData = await restService.getLatestTransformedData(
                id,
              );

              expect(transformedData).toStrictEqual({
                id: exampleTransformedDataId,
                healthStatus: healthStatus,
              });
            });
          });
        }
      });

      describe('when the requested transformed data does not exist', () => {
        const id = exampleTransformedDataId;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `transformed data with id ${id} does not exist`,
            uponReceiving: getLatestTransformedDataRequestTitle(id),
            withRequest: getLatestTransformedDataRequest(id),
            willRespondWith: notFoundResponse,
          });
        });

        it('throws an error', async () => {
          await expect(
            restService.getLatestTransformedData(id),
          ).rejects.toThrow(Error);
        });
      });

      describe('with NaN as requested id', () => {
        beforeEach(async () => {
          await provider.addInteraction({
            state: 'any state',
            uponReceiving: getLatestTransformedDataRequestTitle(NaN),
            withRequest: getLatestTransformedDataRequest(NaN),
            willRespondWith: badRequestResponse,
          });
        });

        it('throws an error', async () => {
          await expect(
            restService.getLatestTransformedData(NaN),
          ).rejects.toThrow(Error);
        });
      });
    });
  });

  describe('using transformation rest', () => {
    let restService: TransformationRest;

    beforeAll(() => {
      const pipelineServiceUrl = provider.mockService.baseUrl;
      restService = new TransformationRest(pipelineServiceUrl);
    });

    describe('transforming data', () => {
      describe('when the transformation request is valid', () => {
        beforeEach(async () => {
          await provider.addInteraction({
            state: 'any state',
            uponReceiving: 'a valid request for transforming data',
            withRequest: transformDataRequest(
              exampleValidTransformationRequest,
            ),
            willRespondWith: transformDataSuccessResponse,
          });
        });

        it('returns a job result that contains no error', async () => {
          const jobResult = await restService.transformData(
            exampleValidTransformationRequest,
          );

          expect(jobResult).toStrictEqual(exampleSuccessJobResult);
        });
      });

      describe('when the function of the transformation request has invalid syntax', () => {
        beforeEach(async () => {
          await provider.addInteraction({
            state: 'any state',
            uponReceiving:
              'an request for transforming data whose function has invalid syntax',
            withRequest: transformDataRequest(
              exampleTransformationRequestWithInvalidSyntax,
            ),
            willRespondWith: transformDataInvalidSyntaxResponse,
          });
        });

        it('returns a job result that contains an error with empty stacktrace', async () => {
          const jobResult = await restService.transformData(
            exampleTransformationRequestWithInvalidSyntax,
          );

          expect(jobResult).toStrictEqual(exampleInvalidSyntaxJobResult);
        });
      });

      describe('when the function of the transformation request throws an error', () => {
        beforeEach(async () => {
          await provider.addInteraction({
            state: 'any state',
            uponReceiving:
              'an request for transforming data whose function throws an error',
            withRequest: transformDataRequest(
              exampleTransformationRequestWithErrorThrowingFunction,
            ),
            willRespondWith: transformDataErrorThrownResponse,
          });
        });

        it('returns a job result that contains an error with nonempty stacktrace', async () => {
          const jobResult = await restService.transformData(
            exampleTransformationRequestWithErrorThrowingFunction,
          );

          expect(jobResult).toStrictEqual(exampleErrorThrownJobResult);
        });
      });
    });
  });
});
