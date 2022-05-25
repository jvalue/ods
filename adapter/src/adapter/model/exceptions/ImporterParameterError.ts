import { AdapterError } from './AdapterError';

export class ImporterParameterError extends AdapterError {
  constructor(msg: string) {
    super(msg);
  }
}
