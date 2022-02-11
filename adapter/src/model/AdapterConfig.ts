import { FormatConfig } from "./FormatConfig";
import { ProtocolConfig } from "./ProtocolConfig";

export class AdapterConfig {
  protocolConfig: ProtocolConfig;
  formatConfig: FormatConfig;
  //TODO JSON CREATER FROM JAVA
  /*
  @JsonCreator
  public AdapterConfig(
    @JsonProperty("protocol") ProtocolConfig protocolConfig,
    @JsonProperty("format") FormatConfig formatConfig) {
    this.protocolConfig = protocolConfig;
    this.formatConfig = formatConfig;
  }
  */
  constructor(protocolConfig: ProtocolConfig, formatConfig: FormatConfig) {
    this.protocolConfig = protocolConfig;
    this.formatConfig = formatConfig;
  }
}
