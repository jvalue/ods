import JobResult from './jobResult';

/**
 * Event send by the Transformation service upon transformation finish
 */
export interface TransformationEventInterface {
    pipelineID: number      // ID of the pipeline
    pipelineName: string    // Name of the pipeline

    dataLocation: string    // url (location) of the pipeline

    jobResult: JobResult         // result of the transformation

    /**
     * Checks if this event is a valid Transformation event,
     * by checking if all field variables exist and are set.
     *
     * @returns     true, if param event is a TransformationEvent, else false
     */
    isValidTransformationEvent(): boolean
}