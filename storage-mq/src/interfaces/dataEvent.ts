import ODSData from './odsData';


/**
 * Event type of the Event sent to the storage-mq
 */
export enum EVENT_TYPE {
    DATA_DDL = 'DDL',
    DATA_DML = 'DML'
}

/**
 * DML-Statement Type of the event sent to the storage-mq
 */
export enum DML_QUERY_TYPE {
    CREATE = 'CREATE',
    REQUEST = 'REQUEST',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

/**
 * DDL-Statement Type of the event sent to the storage-mq
 */
export enum DDL_QUERY_TYPE {
    CREATE_TABLE = 'CREATE_TABLE',
    DROP_TABLE = 'DROP_TABLE'
}

/**
 * Data Event sent to the storage-mq
 */
export interface DataEvent {
    type: any;
    eventType: EVENT_TYPE
}

/**
 * Event for Data modeling on storage-mq service
 * e.g.: INSERT, UPDATE, DELETE
 */
export interface DataDMLEvent extends DataEvent {
    dmlType: DML_QUERY_TYPE;
    data: ODSData
}

/**
 * Event for Data Definition on storage-mq service
 * e.g.: CREATE TABLE, DROP TABLE
 */
export interface DataDDLEvent extends DataEvent {
    ddlType: DDL_QUERY_TYPE
    tableName: string
}