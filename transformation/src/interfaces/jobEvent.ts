/**
 * This interface represents a Transformation Job that can be consumed from
 * a channel.
 * 
 * It contains
 * 
 * @field pipelineID       pipeline ID of the request
 * @field func             function to apply to the data (-> transformation) 
 * @field data             data to be transformed
 */
export default interface JobEvent {
    pipelineID: number      // pipeline ID of the request

    func: string;           // function to apply to the data (-> transformation)

    data: object;           // data to be transformed
}
