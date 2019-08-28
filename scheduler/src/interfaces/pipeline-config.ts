import TriggerConfig from './trigger-config'
// import TransformationConfig from './transformation-config'
import Metadata from './metadata'
import AdapterConfig from './adapter-config'
export default interface PipelineConfig {
  id: number;

  adapter: AdapterConfig;
  transformations: object[];
  persistence: object;
  metadata: Metadata;
  trigger: TriggerConfig;
}
