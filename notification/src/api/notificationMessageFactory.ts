import { PipelineSuccessEvent } from './pipelineEvent';

/**
 * Builds the notification message to be sent,
 * by composing the contents of the transformation event to readable
 * message
 *
 * @param event event to extract transformation results from
 * @param dataLocation the location of the data
 * @returns message to be sent as notification
 */
export const buildMessage = (
  event: PipelineSuccessEvent,
  dataLocation: string,
): string => {
  return (
    `Pipeline ${event.pipelineName} (Pipeline id:${event.pipelineId}) ` +
    `has new data available. Fetch at ${dataLocation}.`
  );
};
