import ODSData from '../models/odsData';
export enum EVENT_TYPE{
    CREATE,
    REQUEST,
    UPDATE,
    DELETE,
}

export interface DataEvent{
    id: number;
    type: EVENT_TYPE;
    
    data: ODSData
}