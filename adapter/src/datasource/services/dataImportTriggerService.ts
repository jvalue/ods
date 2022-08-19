import {
  AdapterConfig,
  FormatConfig,
  ProtocolConfig,
} from '../../adapter/AdapterConfig';
import { AdapterService } from '../../adapter/AdapterService';
import { DataImportResponse } from '../../adapter/api/DataImportResponse.dto';
import { AdapterEndpoint } from '../../adapter/api/rest/AdapterEndpoint';
import { Protocol } from '../../adapter/importer';
import { ADAPTER_AMQP_IMPORT_SUCCESS_TOPIC } from '../../env';
import { DataImportDTO, dataimportEntityToDTO } from '../api/DataImport.dto';
import { DatasourceDTO, datasourceEntityToDTO } from '../api/Datasource.dto';
import { DataImportEntity } from '../model/DataImport.entity';
import { DataImportInsertStatement } from '../model/DataImportInsertStatement';
import { DatasourceEntity } from '../model/Datasource.entity';
import { DataImportRepository } from '../repository/dataImportRepository';
import { DatasourceRepository } from '../repository/datasourceRepository';
import { OutboxRepository } from '../repository/outboxRepository';

import { DataSourceNotFoundException } from './dataSourceNotFoundException';

const routingKey = ADAPTER_AMQP_IMPORT_SUCCESS_TOPIC;

export class DataImportTriggerService {
  constructor(
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

    return await AdapterService.getInstance().executeJob(adapterConfig);
  }

  private async saveDataimport(
    datasourceId: number,
    runtimeParameters: Record<string, unknown> | undefined,
    returnDataImportResponse: DataImportResponse,
  ): Promise<DataImportEntity> {
    const insertStatement: DataImportInsertStatement = {
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

    // This is 'new' solution (instead of overriding url -> override params here and url in importer)
    datasource.protocol.parameters.defaultParameters = replacementParameters;
    const parameters = {
      ...datasource.protocol.parameters,
    };

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
