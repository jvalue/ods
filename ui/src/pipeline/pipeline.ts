export default interface Pipeline {
  id: string;
  adapter: object;
  metadata: object;
  transformations: object[];
  trigger: object;
  persistence?: object;
}
