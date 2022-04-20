import { generateKeySync } from 'crypto';

import { ImporterParameterError } from '../model/exceptions/ImporterParameterError';

import { ImporterParameterDescription } from './ImporterParameterDescription';

export abstract class Importer {
  type: string | undefined;
  description: string | undefined;

  getRequiredParameters(): Array<ImporterParameterDescription> {
    return this.getAvailableParameters().filter(
      (item: ImporterParameterDescription) => item.required,
    );
  }

  abstract getAvailableParameters(): Array<ImporterParameterDescription>;

  async fetch(parameters: Record<string, unknown>): Promise<string> {
    // Throws ImporterParameterException
    this.validateParameters(parameters);
    const x = await this.doFetch(parameters);
    return x;
  }

  abstract getType(): string;
  abstract getDescription(): string;

  abstract doFetch(parameters: Record<string, unknown>): Promise<string>; // Throws ImporterParameterException

  validateParameters(inputParameters: Record<string, unknown>): void {
    // Throws ImporterParameterException;

    let illegalArguments = false;
    let illegalArgumentsMessage = '';

    const possibleParameters: Array<ImporterParameterDescription> =
      this.getAvailableParameters();

    const unnecessaryArguments = [];
    const names = possibleParameters.map((a) => a.name);
    const keys = Object.keys(inputParameters);

    for (const entry of keys) {
      if (!names.includes(entry)) {
        unnecessaryArguments.push(entry);
      }
    }

    if (unnecessaryArguments.length > 0) {
      illegalArguments = true;
      for (const argument of unnecessaryArguments) {
        illegalArgumentsMessage += argument + ' is not needed by importer \n';
      }
    }
    const requiredParameters = this.getRequiredParameters();
    for (const requiredParameter of requiredParameters) {
      // TODO is that OK?
      const name = requiredParameter.name;
      const checkType = (inputParameters[name] as Record<string, unknown>)
        .constructor.name;
      if (inputParameters[requiredParameter.name] == null) {
        illegalArguments = true;
        illegalArgumentsMessage += this.type;
        illegalArgumentsMessage += 'importer requires parameter ';
        illegalArgumentsMessage += name;
        illegalArgumentsMessage += '\n';
      } else if (checkType.toLowerCase() !== requiredParameter.type) {
        illegalArguments = true;
        illegalArgumentsMessage += this.type;
        illegalArgumentsMessage += ' importer requires parameter ';
        illegalArgumentsMessage += name;
        illegalArgumentsMessage += ' to be type ';
        illegalArgumentsMessage += requiredParameter.type;
        illegalArgumentsMessage += '\n';
      }
    }
    if (illegalArguments) {
      throw new ImporterParameterError(illegalArgumentsMessage);
    }
  }
}
