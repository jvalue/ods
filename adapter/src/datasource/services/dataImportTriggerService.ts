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
  // TODO THIS HAS TO BE COMPLETELY REWRITTEN SUCH THAT ID ETC GETS PASSED TO EACH FUNCTION
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
      // TODO refactor such that toString not necessary
      throw new DataSourceNotFoundException(datasourceId.toString());
    }
    // Convert to DTO (relic of old impl)
    const datasource = datasourceEntityToDTO(datasourceEntity);
    let adapterConfig: AdapterConfig;
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
    runtimeParameters: Record<string, unknown>,
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

  private getAdapterConfigWithRuntimeParameters(
    datasource: DatasourceDTO,
    runtimeParameters: Record<string, unknown>,
  ): AdapterConfig {
    const defaultParameter: Record<string, unknown> = datasource.protocol
      .parameters.defaultParameters as Record<string, unknown>;
    // TODO improve such that case is not necessary (custom Type)
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
    runtimeParameters: Record<string, unknown>,
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
    dataImportDTO.parameters = runtimeParameters;

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
