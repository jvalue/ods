import {DeleteResult} from 'typeorm';
import ODSData from '../models/odsData';

export interface DataRepository {
  init(retries: number, backoff: number): Promise<void>
  
  getData(id: number): Promise<ODSData | undefined>
  saveData(data: ODSData): Promise<ODSData>
  deleteData(id: number): Promise<DeleteResult>
  updateData(id: number, data: ODSData): Promise<ODSData>

}
