import { TransformationEventInterface } from "../interfaces/transformationEventInterface"
import JobResult from "../interfaces/jobResult/jobResult"


/**
 * Event send by the Transformation service upon transformation finish
 */
export class TransformationEvent implements TransformationEventInterface {
    pipelineID: number      // ID of the pipeline
    pipelineName: string    // Name of the pipeline

    dataLocation: string    // url (location) of the pipeline

    jobResult: JobResult            // result of the transformation

    constructor(pipelineID: number, pipelineName: string, jobResult: JobResult, dataLocation: string) {
        this.pipelineID = pipelineID
        this.pipelineName = pipelineName
        this.dataLocation = dataLocation
        this.jobResult = jobResult
    }

    /**
     * Checks if this event is a valid Transformation event,
     * by checking if all field variables exist and are set.
     *
     * @returns     true, if param event is a TransformationEvent, else false
     */
    public isValidTransformationEvent(): boolean {
        return !!this.jobResult && !!this.dataLocation && !!this.pipelineID && !!this.pipelineName
    }
}