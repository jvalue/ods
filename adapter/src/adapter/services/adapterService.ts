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
    private static instance: AdapterService;

    constructor () {
    }

    public static getInstance(): AdapterService {
      if (!AdapterService.instance) {
          AdapterService.instance = new AdapterService();
      }

      return AdapterService.instance;
    }


    // To Implement
    public getAllFormats(): Array<Interpreter> {
      return [Format.CSV, Format.JSON, Format.XML]
    }


    public getAllProtocols(): Array<Importer> {
      return [Protocol.HTTP]
     }

    public executeJob(_adapterConfig: AdapterConfig): DataImportResponse {
      var rawData = this.executeProtocol(_adapterConfig.protocolConfig);
      var result = this.executeFormat(rawData, _adapterConfig.formatConfig);
      return new DataImportResponse(result.toString());
    }

    public executeRawJob(_protocolConfig: ProtocolConfig): DataImportResponse {
      var rawData = this.executeProtocol(_protocolConfig);
      return new DataImportResponse(rawData);
    }

    public executeProtocol (config: ProtocolConfig): string{
      var importer = config.protocol.getImporter();
      return importer.fetch(config.parameters);
    }
  
    public executeFormat(rawData: string, config: FormatConfig): string {
      var interpreter = config.format.getInterpreter();
      return interpreter.interpret(rawData, config.parameters);
    }


    
}


//module.exports = AdapterService;