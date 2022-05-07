export class DataSourceNotFoundException extends Error {
  constructor(id: string) {
    super("Datasource with id " +id+ " not found");
  }

}
