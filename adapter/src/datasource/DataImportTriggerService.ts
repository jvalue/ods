import {
  AdapterConfig,
  FormatConfig,
  ProtocolConfig,
} from '../adapter/AdapterConfig';
import { AdapterService } from '../adapter/AdapterService';
import { DataImportResponse } from '../adapter/api/DataImportResponse.dto';
import { AdapterEndpoint } from '../adapter/api/rest/AdapterEndpoint';
import { Protocol } from '../adapter/importer';
import { ADAPTER_AMQP_IMPORT_SUCCESS_TOPIC } from '../env';

import { DataImportDTO, dataimportEntityToDTO } from './api/DataImport.dto';
import { DatasourceDTO, datasourceEntityToDTO } from './api/Datasource.dto';
import { DataSourceNotFoundException } from './exceptions/DataSourceNotFoundException';
import { DataImportEntity } from './repository/DataImport.entity';
import { DataImportInsertEntity } from './repository/DataImportInsert.entity';
import { DataImportRepository } from './repository/DataImportRepository';
import { DatasourceEntity } from './repository/Datasource.entity';
import { DatasourceRepository } from './repository/DatasourceRepository';
import { OutboxRepository } from './repository/OutboxRepository';

const routingKey = ADAPTER_AMQP_IMPORT_SUCCESS_TOPIC;

export class DataImportTriggerService {
  constructor(
    private readonly adapterService: AdapterService,
    private readonly datasourceRepository: DatasourceRepository,
    private readonly dataImportRepository: DataImportRepository,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  private async getDataImport(
    datasourceId: number,
    runtimeParameters: Record<string, unknown> | undefined,
  ): Promise<DataImportResponse> {
    const datasourceEntity = await this.datasourceRepository.getById(
      datasourceId,
    );
    if (!this.validateEntity(datasourceEntity)) {
      throw new DataSourceNotFoundException(datasourceId);
    }
    // Convert to DTO (relic of old impl, because entity has flat object structure)
    const datasource = datasourceEntityToDTO(datasourceEntity);
    const adapterConfig: AdapterConfig = this.getAdapterConfig(
      datasource,
      runtimeParameters,
    );

    return await this.adapterService.executeJob(adapterConfig);
  }

  private async saveDataimport(
    datasourceId: number,
    runtimeParameters: Record<string, unknown> | undefined,
    returnDataImportResponse: DataImportResponse,
  ): Promise<DataImportEntity> {
    const insertStatement: DataImportInsertEntity = {
      data: returnDataImportResponse.data,
      error_messages: [],
      health: 'OK',
      timestamp: new Date(Date.now()).toLocaleString(),
      datasource_id: datasourceId,
      parameters: runtimeParameters,
    };
    return await this.dataImportRepository.create(insertStatement);
  }

  private getAdapterConfig(
    datasource: DatasourceDTO,
    runtimeParameters: Record<string, unknown> | undefined,
  ): AdapterConfig {
    const defaultParameter = datasource.protocol.parameters.defaultParameters;
    const runtimeParams = runtimeParameters?.parameters as
      | Record<string, unknown>
      | undefined;

    const replacementParameters: Record<string, unknown> = {};
    if (defaultParameter !== undefined) {
      Object.assign(replacementParameters, defaultParameter);
    }

    if (runtimeParams !== undefined) {
      Object.assign(replacementParameters, runtimeParams);
    }

    // Fill queryParameters in url
    const parameters = this.fillQueryParameters(datasource, runtimeParameters);

    // Start of toAdapterConfig of old impl
    const protocolConfigObj: ProtocolConfig = {
      protocol: Protocol.HTTP,
      parameters: parameters,
    };
    const format = AdapterEndpoint.getFormat(datasource.format.type);
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

  private fillQueryParameters(
    datasource: DatasourceDTO,
    runtimeParameters: Record<string, unknown> | undefined,
  ): Record<string, unknown> {
    if (datasource.protocol.type !== Protocol.HTTP.type) {
      return datasource.protocol.parameters;
    }

    const replacementParameters: Record<string, unknown> = {};

    // Add all default parameters to the replacement parameters map
    if (datasource.protocol.parameters.defaultParameters !== undefined) {
      Object.assign(
        replacementParameters,
        datasource.protocol.parameters.defaultParameters,
      );
    }

    // Add all runtime parameters to the replacement parameters map
    if (
      runtimeParameters !== undefined &&
      runtimeParameters.parameters !== undefined
    ) {
      Object.assign(replacementParameters, runtimeParameters.parameters);
    }

    // Replace params in url
    let url = datasource.protocol.parameters.location as string;
    const keys = Object.keys(replacementParameters);
    for (const entry of keys) {
      const value = replacementParameters[entry] as string;
      const regex = new RegExp('{' + entry + '}', 'g');
      url = url.replace(regex, value);
    }

    const parameters = datasource.protocol.parameters;
    parameters.location = url;
    return parameters;
  }

  private async publishResult(
    dataSourceId: number,
    routingKey: string,
    returnDataImportResponse: DataImportResponse,
  ): Promise<void> {
    await this.outboxRepository.publishImportTriggerResults(
      routingKey,
      dataSourceId,
      returnDataImportResponse,
    );
  }

  async triggerImport(
    datasourceId: number,
    runtimeParameters: Record<string, unknown> | undefined,
  ): Promise<DataImportDTO> {
    const returnDataImportResponse = await this.getDataImport(
      datasourceId,
      runtimeParameters,
    );
    const dataImport = await this.saveDataimport(
      datasourceId,
      runtimeParameters,
      returnDataImportResponse,
    );

    const dataImportDTO = dataimportEntityToDTO(
      dataImport,
      `/datasources/${datasourceId}/imports/${dataImport.id}/data`,
    );
    if (runtimeParameters !== undefined) {
      dataImportDTO.parameters = runtimeParameters;
    }

    await this.publishResult(
      datasourceId,
      routingKey,
      returnDataImportResponse,
    );
    return dataImportDTO;
  }

  private validateEntity(result: unknown): result is DatasourceEntity {
    if (result === undefined) {
      return false;
    }
    return true;
  }
}