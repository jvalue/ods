import { Importer } from '../importer/Importer';
import { Interpreter } from '../interpreter/Interpreter';
import { AdapterConfig } from '../model/AdapterConfig';
import { DataImportResponse } from '../model/DataImportResponse';
import { Format } from '../model/enum/Format';
import { Protocol } from '../model/enum/Protocol';
import { FormatConfig } from '../model/FormatConfig';
import { ProtocolConfig } from '../model/ProtocolConfig';

export class AdapterService {
  /**
   * @description Create a singleton instance of AdapterService
   */
  private static instance: AdapterService | undefined = undefined;

  static getInstance(): AdapterService {
    if (!AdapterService.instance) {
      AdapterService.instance = new AdapterService();
    }

    return AdapterService.instance;
  }

  getAllFormats(): Interpreter[] {
    return [Format.CSV, Format.JSON, Format.XML];
  }

  getAllProtocols(): Importer[] {
    return [Protocol.HTTP];
  }

  /**
   * Executes an adapter configuration
   *
   * @param _adapterConfig the adapter configuration
   * @returns the imported and interpreted data
   * @throws ImporterParameterError    on errors in the interpreter config (e.g. missing parameters, ...)
   * @throws InterpreterParameterError on errors in the interpreter config (e.g. missing parameters, ...)
   * @throws Error                   on response errors when importing the data
   */
  async executeJob(_adapterConfig: AdapterConfig): Promise<DataImportResponse> {
    const rawData = await this.executeProtocol(_adapterConfig.protocolConfig);
    const result = await this.executeFormat(
      rawData,
      _adapterConfig.formatConfig,
    );
    const returnValue: DataImportResponse = { data: result };
    return returnValue;
  }

  /**
   * Executes an protocol configuration
   *
   * @param _protocolConfig the protocol configuration
   * @returns the imported and interpreted data
   * @throws ImporterParameterError    on errors in the interpreter config (e.g. missing parameters, ...)
   * @throws Error                   on response errors when importing the data
   */
  async executeRawJob(
    _protocolConfig: ProtocolConfig,
  ): Promise<DataImportResponse> {
    const value = await this.executeProtocol(_protocolConfig);
    const returnValue: DataImportResponse = { data: value };
    return returnValue;
  }

  async executeProtocol(config: ProtocolConfig): Promise<string> {
    const importer = config.protocol.getImporter();
    return await importer.fetch(config.parameters);
  }

  async executeFormat(rawData: string, config: FormatConfig): Promise<string> {
    const interpreter = config.format.getInterpreter();
    return await interpreter.interpret(rawData, config.parameters);
  }
}
export const adapterService = AdapterService.getInstance();
