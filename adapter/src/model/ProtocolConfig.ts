export class ProtocolConfig {
    
    //protocol:Protocol;
    parameters: Map<string, any> | undefined;
    //TODO JSON CREATER FROM JAVA
    /*
    JsonCreator
  public ProtocolConfig(
    @JsonProperty("type") Protocol protocol,
    @JsonProperty("parameters") Map<String, Object> parameters) {
    this.protocol = protocol;
    this.parameters = parameters;
  }
    */
    constructor(/*protocol: Protocol,*/ parameters: Map<string, any>) {
      //this.protocol = protocol;
      this.parameters = parameters;
    }
  }
  