export default interface AdapterConfig {
  protocol: {
    type: String,
    parameters: {
      location?: String
    }
  }
  format: {
    type: String,
    parameters: object
  }
}
