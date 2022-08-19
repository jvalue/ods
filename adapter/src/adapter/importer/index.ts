import { HttpImporter } from './HttpImporter';

export * from './Importer';

export const Protocol = {
  HTTP: new HttpImporter(),
};
