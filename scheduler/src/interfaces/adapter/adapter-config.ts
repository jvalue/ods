export default interface AdapterConfig {
  protocol: {
    type: String,
    parameters: {
      location: string
    }
  }
  format: {
    type: String
  }
}
