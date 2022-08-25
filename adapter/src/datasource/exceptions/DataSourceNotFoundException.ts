export class DataSourceNotFoundException extends Error {
  constructor(id: number) {
    super(`Datasource with id ${id} not found`);
  }
}
