import { AdapterEndpoint } from '../../adapter/api/rest/adapterEndpoint';
import { AdapterConfig } from '../../adapter/model/AdapterConfig';
import { DataImportResponse } from '../../adapter/model/DataImportResponse';
import { Format } from '../../adapter/model/enum/Format';
import { Protocol } from '../../adapter/model/enum/Protocol';
import { FormatConfig } from '../../adapter/model/FormatConfig';
import { ProtocolConfig } from '../../adapter/model/ProtocolConfig';
import { AdapterService } from '../../adapter/services/adapterService';
import { ADAPTER_AMQP_IMPORT_SUCCESS_TOPIC } from '../../env';
import { DataImportDTO, dataimportEntityToDTO } from '../model/DataImport.dto';
import { DataImportEntity } from '../model/DataImport.entity';
import { DataImportInsertStatement } from '../model/DataImportInsertStatement';
import { DatasourceDTO, datasourceEntityToDTO } from '../model/Datasource.dto';
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
    // Convert to DTO (relic of old impl)
    const datasource = datasourceEntityToDTO(datasourceEntity);
    let adapterConfig: AdapterConfig;

    // TODO merge getAdapterConfigWithOutRuntimeParameters and getAdapterConfigWithRuntimeParameters
    if (runtimeParameters) {
      adapterConfig = this.getAdapterConfigWithRuntimeParameters(
        datasource,
        runtimeParameters,
      );
    } else {
      adapterConfig = this.getAdapterConfigWithOutRuntimeParameters(datasource);
    }

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

  /* Private getAdapterConfig(
    datasource: DatasourceDTO,
    runtimeParameters: Record<string, unknown> | undefined,
  ): AdapterConfig {
    // TODO extract into fillQueryParameters (like old impl)
    const defaultParameter = datasource.protocol.parameters
      .defaultParameters as Record<string, unknown> | undefined;
    const runtimeParams = runtimeParameters?.parameters as
      | Record<string, unknown>
      | undefined;
    // TODO improve such that case is not necessary (custom Type)

    const replacementParameters: Record<string, unknown> = {};
    if (defaultParameter !== undefined) {
      Object.assign(replacementParameters, defaultParameter);
    }

    if (runtimeParams !== undefined) {
      Object.assign(replacementParameters, runtimeParams);
    }

    /* TODO seems like this was moved into HTTPImporter -> whole fillQueryParameters no longer necessary
    let url: string = datasource.protocol.parameters.location as string;
    for (const parameterKey in replacementParameters) {
      // TODO check if that works (value is unknown)
      if (
        Object.prototype.hasOwnProperty.call(
          replacementParameters,
          parameterKey,
        )
      ) {
        url = url.replace(
          '{' + parameterKey + '}',
          replacementParameters[parameterKey] as string,
        );
      }
    }

    const parameters = datasource.protocol.parameters;
    parameters.location = url;/

    // Start of toAdapterConfig of old impl
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
  }*/

  private getAdapterConfigWithRuntimeParameters(
    datasource: DatasourceDTO,
    runtimeParameters: Record<string, unknown>,
  ): AdapterConfig {
    const defaultParameter: Record<string, unknown> = datasource.protocol
      .parameters.defaultParameters as Record<string, unknown>;
    // TODO improve such that case is not necessary (custom Type)

    // TODO this should merge default params with runtimeParams
    // TODO interfaces for types (like AdapterConfig)
    for (const entry in runtimeParameters.parameters as Record<
      string,
      unknown
    >) {
      // TODO correct?
      if (entry) {
        defaultParameter[entry] = (
          runtimeParameters.parameters as Record<string, unknown>
        )[entry];
      }
    }
    datasource.protocol.parameters.defaultParameters = defaultParameter;
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

    // TODO the following line probably crashes (later logs not visible)
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

  private getAdapterConfigWithOutRuntimeParameters(
    datasource: DatasourceDTO,
  ): AdapterConfig {
    const parameters = {
      ...datasource.protocol.parameters,
    } as Record<string, unknown>;
    const datasourceFormatParameters = datasource.format.parameters;
    const protocolConfigObj: ProtocolConfig = {
      protocol: new Protocol(Protocol.HTTP),
      parameters: parameters,
    };
    const format = new Format(
      AdapterEndpoint.getFormat(datasource.format.type),
    );
    const formatConfigObj: FormatConfig = {
      format: format,
      parameters: datasourceFormatParameters,
    };
    const adapterConfig: AdapterConfig = {
      protocolConfig: protocolConfigObj,
      formatConfig: formatConfigObj,
    };
    return adapterConfig;
  }

  private validateEntity(result: unknown): result is DatasourceEntity {
    if (!result || result === undefined) {
      return false;
    }
    return true;
  }
}
