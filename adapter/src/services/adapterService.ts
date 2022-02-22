import { Interpreter } from "../interpreter/interpreter";
import { AdapterConfig } from "../model/AdapterConfig";
import { DataImportResponse } from "../model/DataImportResponse";

import { ProtocolConfig } from "../model/ProtocolConfig";

export class AdapterService {
    /**
     * @description Create an instance of AdapterService
     */
    constructor () {
    }

    // To Implement
    static getAllFormats(): Array<Interpreter> {
      try {
        let interpreters: Interpreter[] = [new Interpreter("TYPE_TEST", "Dies ist eine BeschreibungTestPV")]
        return interpreters
      } catch (err) {
        throw err
      }
    }

    static getAllProtocols(): Array<Interpreter> {
        try {
          let protocols: Interpreter[] = [new Interpreter("TYPE_TEST", "Dies ist eine BeschreibungTestPV")]
          return protocols
        } catch (err) {
          throw err
        }
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
