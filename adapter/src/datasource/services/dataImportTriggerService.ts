import {RuntimeParameters} from "../model/DataSourceTriggerEvent";
import {AdapterConfig} from "../../adapter/model/AdapterConfig";
import {AdapterService} from "../../adapter/services/adapterService";
import {DataImportInsertStatement} from "../model/DataImportInsertStatement";
import {ProtocolConfig} from "../../adapter/model/ProtocolConfig";
import {Protocol} from "../../adapter/model/enum/Protocol";
import {Format} from "../../adapter/model/enum/Format";
import {AdapterEndpoint} from "../../adapter/api/rest/adapterEndpoint";
import {FormatConfig} from "../../adapter/model/FormatConfig";
import {DatasourceRepository} from "../repository/datasourceRepository";
import {DataImportRepository} from "../repository/dataImportRepository";
import {DataImportResponse} from "../../adapter/model/DataImportResponse";
import {ADAPTER_AMQP_IMPORT_SUCCESS_TOPIC} from "../../env";
import {OutboxRepository} from "../repository/outboxRepository";
import {DataSourceNotFoundException} from "./dataSourceNotFoundException";

const datasourceRepository: DatasourceRepository = new DatasourceRepository();
const dataImportRepository: DataImportRepository = new DataImportRepository();
const routingKey = ADAPTER_AMQP_IMPORT_SUCCESS_TOPIC;
const outboxRepository: OutboxRepository = new OutboxRepository();

export class DataImportTriggerService {

  id: string;
  runtimeParameters: RuntimeParameters;

  constructor(id: string, runtimeParameters: RuntimeParameters) {
    this.id = id;
    this.runtimeParameters = runtimeParameters;
  }

  private async getDataImport() {
    let datasource;
    try {
      datasource = await datasourceRepository.getDataSourceById(this.id);
    }
    //TODO check if exception is thrown or just null value result if debugging is available...
    catch (e) {
      throw new DataSourceNotFoundException(this.id);
    }
    let adapterConfig: AdapterConfig;
    if (this.runtimeParameters) {
      adapterConfig = this.getAdapterConfigWithRuntimeParameters(datasource, this.runtimeParameters);
    } else {
      adapterConfig = this.getAdapterConfigWithOutRuntimeParameters(datasource);
    }

    return await AdapterService.getInstance().executeJob(adapterConfig);

  }

  private async saveDataimport(returnDataImportResponse: any) {
    const insertStatement: DataImportInsertStatement = {
      data: returnDataImportResponse,
      error_messages: [],
      health: 'OK',
      timestamp: new Date(Date.now()).toLocaleString(),
      datasource_id: this.id,
    };
    return await dataImportRepository.addDataImport(
      insertStatement,
    );
  }

  private getAdapterConfigWithRuntimeParameters(
    datasource: any,
    runtimeParameters: any,
  ): AdapterConfig {

    let defaultParameter=datasource.protocol.parameters.defaultParameters;
    for(const entry in runtimeParameters.parameters){
      defaultParameter[entry]=runtimeParameters.parameters[entry];
    }
    datasource.protocol.parameters.defaultParameters=defaultParameter;
    const parameters = {
      ...datasource.protocol.parameters,
    };

    const protocolConfigObj: ProtocolConfig = {
      protocol: new Protocol(Protocol.HTTP),
      parameters: parameters,
    };
    const format = new Format(
      AdapterEndpoint.getFormat(datasource.format.type),
    );
    const formatConfigObj: FormatConfig = {
      format: format,
      parameters: datasource.format.parameters,
    };
    return {
      protocolConfig: protocolConfigObj,
      formatConfig: formatConfigObj,
    };
  }

  private async publishResult(dataSourceId:Number, routingKey: string, returnDataImportResponse: DataImportResponse) {
    await outboxRepository.publishImportTriggerResults(
      dataSourceId,
      returnDataImportResponse,
      routingKey,
    );
  }

  async triggerImport(dataSourceId:Number) {
    let returnDataImportResponse = await this.getDataImport();
    let dataImport = await this.saveDataimport(returnDataImportResponse);
    await this.publishResult(dataSourceId,routingKey, returnDataImportResponse);
    return dataImport;
  }

  private getAdapterConfigWithOutRuntimeParameters(datasource: Datasource) {
    const parameters = {
      ...datasource.protocol.parameters,
    };

    const protocolConfigObj: ProtocolConfig = {
      protocol: new Protocol(Protocol.HTTP),
      parameters: parameters,
    };
    const format = new Format(
      AdapterEndpoint.getFormat(datasource.format.type),
    );
    const formatConfigObj: FormatConfig = {
      format: format,
      parameters: datasource.format.parameters,
    };
    const adapterConfig: AdapterConfig = {
      protocolConfig: protocolConfigObj,
      formatConfig: formatConfigObj,
    };
    return adapterConfig;
  }
}

interface Datasource {
  schema: any;
  protocol: { type: any; parameters: any };
  metadata: { license: any; author: any; displayName: any; creationTimestamp: any; description: any };
  format: { type: any; parameters: any };
  trigger: { periodic: any; interval: number; firstExecution: any };
  id: number
}
