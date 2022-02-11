export class FormatConfig {
    
    //format:Format;
    parameters: Map<string, any> | undefined;
    //TODO JSON CREATER FROM JAVA
    /*
    @JsonCreator
  public FormatConfig(
    @JsonProperty("type") Format format,
    @JsonProperty("parameters") Map<String, Object> parameters) {
    this.format = format;
    this.parameters = parameters;
  }
    */
    constructor(/*format: Format,*/ parameters: Map<string, any>) {
      //this.format = format;
      this.parameters = parameters;
    }
  }
  