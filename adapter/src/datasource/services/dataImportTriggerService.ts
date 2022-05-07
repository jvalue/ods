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

    const datasource = await datasourceRepository.getDataSourceById(this.id);
    let adapterConfig: AdapterConfig;
    if (this.runtimeParameters) {
      adapterConfig = this.getAdapterConfigWithRuntimeParameters(datasource, this.runtimeParameters);
    } else {
      adapterConfig = this.getAdapterConfigWithOutRuntimeParameters(datasource);
    }

    const returnDataImportResponse =
      await AdapterService.getInstance().executeJob(adapterConfig);
    return returnDataImportResponse;
    /* Const latestImport: unknown =
      await dataImportRepository.getLatestMetaDataImportByDatasourceId(id);*/

  }

  private async saveDataimport(returnDataImportResponse: any) {
    // TODO id..
    const insertStatement: DataImportInsertStatement = {
      id: 667,
      data: returnDataImportResponse,
      error_messages: [],
      health: 'OK',
      timestamp: new Date(Date.now()).toLocaleString(),
      datasource_id: this.id,
    };
    const dataImport = await dataImportRepository.addDataImport(
      insertStatement,
    );
    return dataImport;
  }

  private getAdapterConfigWithRuntimeParameters(
    datasource: any,
    runtimeParameters: any,
  ): AdapterConfig {
    const parameters = {
      ...datasource.protocol.parameters,
      ...runtimeParameters.parameters,
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

  private async publishResult(routingKey: string, returnDataImportResponse: DataImportResponse) {
    await outboxRepository.publishToOutbox(
      returnDataImportResponse,
      routingKey,
    );
  }

  async triggerImport() {
    let returnDataImportResponse = await this.getDataImport();
    let dataImport = await this.saveDataimport(returnDataImportResponse);
    await this.publishResult(routingKey, returnDataImportResponse);
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
