import {
  PipelineCreatedEvent,
  PipelineDeletedEvent,
} from './api/pipelineConfigEventHandler';
import { PipelineExecutedEvent } from './api/pipelineExecutionEventHandler';

export const examplePipelineCreatedEvent: PipelineCreatedEvent = {
  pipelineId: 1,
  pipelineName: 'some pipeline name',
};

export const examplePipelineDeletedEvent: PipelineDeletedEvent = {
  pipelineId: 1,
  pipelineName: 'some pipeline name',
};

export const examplePipelineExecutedEvent: PipelineExecutedEvent = {
  pipelineId: 1,
  pipelineName: 'some pipeline name',
  data: {},
};
