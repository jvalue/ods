import path from 'path';

import { JestPactOptions, pactWith } from 'jest-pact';

import { TransformationRest } from './edit/transformation/transformationRest';
import {
  badRequestResponse,
  createRequest,
  createRequestTitle,
  createSuccessResponse,
  deleteRequest,
  deleteRequestTitle,
  deleteSuccessResponse,
  exampleErrorThrownJobResult,
  exampleInvalidSyntaxJobResult,
  examplePipeline,
  exampleSuccessJobResult,
  exampleTransformationRequestWithErrorThrowingFunction,
  exampleTransformationRequestWithInvalidSyntax,
  exampleTransformedData,
  exampleValidTransformationRequest,
  getAllEmptyResponse,
  getAllRequest,
  getAllRequestTitle,
  getAllSuccessResponse,
  getByDatasourceIdRequest,
  getByDatasourceIdRequestTitle,
  getByDatasourceIdSuccessResponse,
  getByIdRequest,
  getByIdRequestTitle,
  getByIdSuccessResponse,
  getLatestTransformedDataRequest,
  getLatestTransformedDataRequestTitle,
  getLatestTransformedDataSuccessResponse,
  notFoundResponse,
  transformDataErrorThrownResponse,
  transformDataInvalidSyntaxResponse,
  transformDataRequest,
  transformDataSuccessResponse,
  updateRequest,
  updateRequestTitle,
  updateSuccessResponse,
} from './pipeline.consumer.pact.fixtures';
import { PipelineRest } from './pipelineRest';
import { PipelineTransRest } from './pipelineTransRest';

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
      describe('when some pipelines exist', () => {
        beforeEach(async () => {
          await provider.addInteraction({
            state: 'some pipelines exist',
            uponReceiving: getAllRequestTitle,
            withRequest: getAllRequest,
            willRespondWith: getAllSuccessResponse,
          });
        });

        it('returns a non-empty pipeline array', async () => {
          const pipelines = await restService.getAllPipelines();

          expect(pipelines).toStrictEqual([examplePipeline]);
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
      describe('when the requested pipeline exists', () => {
        const id = examplePipeline.id;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipeline with id ${id} exists`,
            uponReceiving: getByIdRequestTitle(id),
            withRequest: getByIdRequest(id),
            willRespondWith: getByIdSuccessResponse,
          });
        });

        it('returns the requested pipeline', async () => {
          const pipeline = await restService.getPipelineById(id);

          expect(pipeline).toStrictEqual(examplePipeline);
        });
      });

      describe('when the requested pipeline does not exist', () => {
        const id = examplePipeline.id;

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
      describe('when a pipeline with the requested datasource id exist', () => {
        const id = examplePipeline.datasourceId;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipelines with datasource id ${id} exist`,
            uponReceiving: getByDatasourceIdRequestTitle(id),
            withRequest: getByDatasourceIdRequest(id),
            willRespondWith: getByDatasourceIdSuccessResponse,
          });
        });

        it('returns the requested pipelines', async () => {
          const pipelines = await restService.getPipelineByDatasourceId(id);

          expect(pipelines).toHaveLength(1);
          expect(pipelines[0]).toStrictEqual(examplePipeline);
        });
      });

      describe('when no pipelines with the requested datasource id exist', () => {
        const id = examplePipeline.datasourceId;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipelines with datasource id ${id} do not exist`,
            uponReceiving: getByDatasourceIdRequestTitle(id),
            withRequest: getByDatasourceIdRequest(id),
            willRespondWith: notFoundResponse,
          });
        });

        it('throws an error', async () => {
          await expect(
            restService.getPipelineByDatasourceId(id),
          ).rejects.toThrow(Error);
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
            restService.getPipelineByDatasourceId(NaN),
          ).rejects.toThrow(Error);
        });
      });
    });

    describe('creating a pipeline', () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: 'any state',
          uponReceiving: createRequestTitle,
          withRequest: createRequest,
          willRespondWith: createSuccessResponse,
        });
      });

      it('returns the created pipeline', async () => {
        const createdPipeline = await restService.createPipeline(
          examplePipeline,
        );

        const expectedPipeline = {
          ...examplePipeline,
          id: createdPipeline.id,
        };
        expect(createdPipeline).toStrictEqual(expectedPipeline);
      });
    });

    describe('updating a pipeline', () => {
      describe('when the pipeline to update exists', () => {
        const id = examplePipeline.id;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipeline with id ${id} exists`,
            uponReceiving: updateRequestTitle(id),
            withRequest: updateRequest(id),
            willRespondWith: updateSuccessResponse,
          });
        });

        it('succeeds', async () => {
          await restService.updatePipeline(examplePipeline);
        });
      });

      describe('when the pipeline to update does not exist', () => {
        const id = examplePipeline.id;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipeline with id ${id} does not exist`,
            uponReceiving: updateRequestTitle(id),
            withRequest: updateRequest(id),
            willRespondWith: notFoundResponse,
          });
        });

        it('throws an error', async () => {
          await expect(
            restService.updatePipeline(examplePipeline),
          ).rejects.toThrow(Error);
        });
      });

      describe('with NaN as id for the pipline to update', () => {
        beforeEach(async () => {
          await provider.addInteraction({
            state: 'any state',
            uponReceiving: updateRequestTitle(NaN),
            withRequest: updateRequest(NaN),
            willRespondWith: badRequestResponse,
          });
        });

        it('throws an error', async () => {
          const pipelineToUpdate = {
            ...examplePipeline,
            id: NaN,
          };
          await expect(
            restService.updatePipeline(pipelineToUpdate),
          ).rejects.toThrow(Error);
        });
      });
    });

    describe('deleting a pipeline', () => {
      describe('when the pipeline to delete exists', () => {
        const id = examplePipeline.id;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipeline with id ${id} exists`,
            uponReceiving: deleteRequestTitle(id),
            withRequest: deleteRequest(id),
            willRespondWith: deleteSuccessResponse,
          });
        });

        it('succeeds', async () => {
          await restService.deletePipeline(id);
        });
      });

      describe('when the pipeline to delete does not exist', () => {
        const id = examplePipeline.id;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `pipeline with id ${id} does not exist`,
            uponReceiving: deleteRequestTitle(id),
            withRequest: deleteRequest(id),
            willRespondWith: deleteSuccessResponse,
          });
        });

        it('succeeds', async () => {
          await restService.deletePipeline(id);
        });
      });

      describe('with NaN as id for the pipline to update', () => {
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
        const id = exampleTransformedData.id;

        beforeEach(async () => {
          await provider.addInteraction({
            state: `transformed data with id ${id} exists`,
            uponReceiving: getLatestTransformedDataRequestTitle(id),
            withRequest: getLatestTransformedDataRequest(id),
            willRespondWith: getLatestTransformedDataSuccessResponse,
          });
        });

        it('returns the requested transformed data', async () => {
          const transformedData = await restService.getLatestTransformedData(
            id,
          );

          expect(transformedData).toStrictEqual(exampleTransformedData);
        });
      });

      describe('when the requested transformed data does not exist', () => {
        const id = exampleTransformedData.id;

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
