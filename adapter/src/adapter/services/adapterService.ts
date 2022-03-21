import { Importer } from "../importer/Importer";
import { Interpreter } from "../interpreter/Interpreter";
import { AdapterConfig } from "../model/AdapterConfig";
import { DataImportResponse } from "../model/DataImportResponse";
import { Format } from "../model/enum/Format";
import { Protocol } from "../model/enum/Protocol";
import { FormatConfig } from "../model/FormatConfig";

import { ProtocolConfig } from "../model/ProtocolConfig";

export class AdapterService {
    /**
     * @description Create an instance of AdapterService
     */
    constructor () {
    }

    // To Implement
    getAllFormats(): Array<Interpreter> {
      return [Format.CSV, Format.JSON, Format.XML]
    }


    getAllProtocols(): Array<Importer> {
      return [Protocol.HTTP]
     }

    executeJob(_adapterConfig: AdapterConfig): DataImportResponse {
      var rawData = this.executeProtocol(_adapterConfig.protocolConfig);
      var result = this.executeFormat(rawData, _adapterConfig.formatConfig);
      return new DataImportResponse(result.toString());
    }

    executeRawJob(_protocolConfig: ProtocolConfig): DataImportResponse {
      var rawData = this.executeProtocol(_protocolConfig);
      return new DataImportResponse(rawData);
    }

    executeProtocol (config: ProtocolConfig): string{
      var importer = config.protocol.getImporter();
      return importer.fetch(config.parameters);
    }
  
    executeFormat(rawData: string, config: FormatConfig): string {
      var interpreter = config.format.getInterpreter();
      return interpreter.interpret(rawData, config.parameters);
    }
}

module.exports = AdapterService;