import { Data } from './data'

export default interface TransformationRequest {
  func: string;
  data: Data;
}
