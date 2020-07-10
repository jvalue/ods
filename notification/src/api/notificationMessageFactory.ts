import { TransformationEvent } from "./transformationEvent"

export namespace NotificationMessageFactory {

  /**
   * Builds the notification message to be sent,
   * by composing the contents of the transformation event to readable
   * message
   *
   * @param event event to extract transformation results from
   * @returns message to be sent as notification
   */
  export const buildMessage = (event: TransformationEvent): string => {

    let message: string                       // message to return
    const jobError = event.jobResult.error    // Error of transformation (if exists)

    /*======================================================
    *  Build Message for successful transformation/pipeline
    *=======================================================*/
    if (jobError === undefined) {
      // Build Stats (Time measures for transformation execution)
      const jobStats = event.jobResult.stats
      const start = new Date(jobStats.startTimestamp)
      const end = new Date(jobStats.endTimestamp)


      // Build Success Message
      message = `Pipeline ${event.pipelineName}(Pipeline ID:${event.pipelineId}) ` +
        `has new data available. Fetch at ${event.dataLocation}.

        Transformation Details:
              Start: ${start}
              End:  ${end}
              Duration: ${jobStats.durationInMilliSeconds} ms`

    } else {
      /*====================================================
      *  Build Message for failed transformation/pipline
      *====================================================*/
      message = `Pipeline ${event.pipelineName}(Pipeline ID:${event.pipelineId}) failed.

          Details:
            Line: ${jobError.lineNumber}
            Message: ${jobError.message}
            Stacktrace: ${ jobError.stacktrace}`
    }

    return message
  }
}
