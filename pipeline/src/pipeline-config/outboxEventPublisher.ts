import { ClientBase } from 'pg';

import {
  AMQP_PIPELINE_CONFIG_CREATED_TOPIC,
  AMQP_PIPELINE_CONFIG_DELETED_TOPIC,
  AMQP_PIPELINE_CONFIG_UPDATED_TOPIC,
  AMQP_PIPELINE_EXECUTION_ERROR_TOPIC,
  AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC,
} from '../env';

import { insertEvent } from './pipelineEventRepository';

export async function publishCreation(
  client: ClientBase,
  pipelineId: number,
  pipelineName: string,
): Promise<string> {
  const content = {
    pipelineId: pipelineId,
    pipelineName: pipelineName,
  };
  return await insertEvent(client, AMQP_PIPELINE_CONFIG_CREATED_TOPIC, content);
}

export async function publishUpdate(
  client: ClientBase,
  pipelineId: number,
  pipelineName: string,
): Promise<string> {
  const content = {
    pipelineId: pipelineId,
    pipelineName: pipelineName,
  };
  return await insertEvent(client, AMQP_PIPELINE_CONFIG_UPDATED_TOPIC, content);
}

export async function publishDeletion(
  client: ClientBase,
  pipelineId: number,
  pipelineName: string,
): Promise<string> {
  const content = {
    pipelineId: pipelineId,
    pipelineName: pipelineName,
  };
  return await insertEvent(client, AMQP_PIPELINE_CONFIG_DELETED_TOPIC, content);
}

export async function publishError(
  client: ClientBase,
  pipelineId: number,
  pipelineName: string,
  errorMsg: string,
): Promise<string> {
  const content = {
    pipelineId: pipelineId,
    pipelineName: pipelineName,
    error: errorMsg,
  };
  return await insertEvent(
    client,
    AMQP_PIPELINE_EXECUTION_ERROR_TOPIC,
    content,
  );
}

export async function publishSuccess(
  client: ClientBase,
  pipelineId: number,
  pipelineName: string,
  result: unknown,
  schema?: Record<string, unknown>, // Fix @typescript-eslint/ban-types for object type
): Promise<string> {
  const content = {
    pipelineId: pipelineId,
    pipelineName: pipelineName,
    data: result,
    schema: schema != null ? schema : undefined,
  };
  return await insertEvent(
    client,
    AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC,
    content,
  );
}
