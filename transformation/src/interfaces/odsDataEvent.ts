import ODSData from "./odsData";


export enum EVENT_TYPE{
    CREATE = 'CREATE',
    REQUEST = 'REQUEST',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

export interface DataEvent{
    id: number;
    type: EVENT_TYPE;

    data: ODSData
}