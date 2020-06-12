
/**
 * Event send by the Transformation service upon transformation finish
 */
export interface TransformationEvent{
    pipelineID: number      // ID of the pipeline
    pipelineName: string    // Name of the pipeline

    dataLocation: string    // url (location) of the pipeline

    result: boolean         // result of the transformation
}