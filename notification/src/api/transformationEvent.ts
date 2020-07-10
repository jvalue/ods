
/**
 * Event send by the transformation service upon transformation finish
 */
export interface TransformationEvent {
    pipelineId: number
    pipelineName: string

    dataLocation: string    // url (location) of the queryable data

    data?: object
    error?: object
}
