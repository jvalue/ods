import TriggerConfig from './trigger-config'
export default interface PipelineConfig {
  id: number;

  adapter: any;
  transformations: any[];
  persistence: any;
  metadata: any;

  trigger: TriggerConfig;
}
