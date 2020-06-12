
/**
 * Event send by the Transformation service upon transformation finish
 */
export class TransformationEvent{
    pipelineID: number      // ID of the pipeline
    pipelineName: string    // Name of the pipeline

    dataLocation: string    // url (location) of the pipeline

    result: boolean         // result of the transformation

    constructor(pipelineID: number, pipelineName: string, dataLocation: string, result: boolean) {
        this.pipelineID = pipelineID
        this.pipelineName = pipelineName
        this.dataLocation = dataLocation
        this.result = result
    }
}