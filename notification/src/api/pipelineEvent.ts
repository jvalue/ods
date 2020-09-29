import { hasProperty, isObject } from '../validators'

export interface PipelineSuccessEvent {
  pipelineId: number
  pipelineName: string
  data: object
}

/**
 * Checks if this event is a valid pipeline success event,
 * by checking if all field variables exist and are set.
 *
 * @returns     true, if param event is a PipelineSuccessEvent, else false
 */
export function isValidPipelineSuccessEvent (event: unknown): event is PipelineSuccessEvent {
  return isObject(event) &&
    hasProperty(event, 'pipelineId') &&
    hasProperty(event, 'pipelineName') &&
    hasProperty(event, 'data')
}
