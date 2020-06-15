import { TransformationEventInterface } from "./transformationEventInterface"

/**
 * Event send by the Transformation service upon transformation finish
 */
export class TransformationEvent implements TransformationEventInterface {
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

    /**
     * Checks if this event is a valid Transformation event,
     * by checking if all field variables exist and are set.
     *
     * @returns     true, if param event is a TransformationEvent, else false
     */
    public isValidTransformationEvent(): boolean {
        return !!this.dataLocation && !!this.pipelineID && !!this.pipelineName && !!this.result
    }
}