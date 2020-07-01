import {DeleteResult} from 'typeorm';
import ODSData from './odsData';

export interface DataRepository {
  init(retries: number, backoff: number): Promise<void>
  
  getData(tableName: string, conditions?: object): Promise<ODSData[] | undefined>
  saveData(tableName: string, data: ODSData): Promise<boolean>
  deleteData(tableName: string, conditions?: object): Promise<boolean>
  updateData(tableName: string, data: ODSData, conditions?: object): Promise<boolean>

  createDataTable(tableName: string): Promise<boolean>
  dropTable(tableName: string): Promise<boolean>

}
