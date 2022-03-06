import { Importer } from "../importer/Importer";
import { Interpreter } from "../interpreter/Interpreter";
import { AdapterConfig } from "../model/AdapterConfig";
import { DataImportResponse } from "../model/DataImportResponse";
import { Format } from "../model/enum/Format";
import { Protocol } from "../model/enum/Protocol";

import { ProtocolConfig } from "../model/ProtocolConfig";

export class AdapterService {
    /**
     * @description Create an instance of AdapterService
     */
    constructor () {
    }

    // To Implement
    static getAllFormats(): Array<Interpreter> {
      return [Format.CSV, Format.JSON, Format.XML]
    }


    static getAllProtocols(): Array<Importer> {
      return [Protocol.HTTP]
     }

    static executeJob(_adapterConfig: AdapterConfig): DataImportResponse {
      // TODO IMPLEMENT
      return new DataImportResponse("Data_test")
    }

    static executeRawJob(_protocolConfig: ProtocolConfig): DataImportResponse {
      // TODO IMPLEMENT
      return new DataImportResponse("Data_test")
    }

}

  module.exports = AdapterService;
