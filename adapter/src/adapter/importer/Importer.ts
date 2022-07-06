import { ImporterParameterError } from '../model/exceptions/ImporterParameterError';

import { ImporterParameterDescription } from './ImporterParameterDescription';

export abstract class Importer {
  type: string | undefined;
  description: string | undefined;

  getRequiredParameters(): ImporterParameterDescription[] {
    return this.getAvailableParameters().filter(
      (item: ImporterParameterDescription) => item.required,
    );
  }

  abstract getAvailableParameters(): ImporterParameterDescription[];

  async fetch(parameters: Record<string, unknown>): Promise<string> {
    this.validateParameters(parameters);
    const x = await this.doFetch(parameters);
    return x;
  }

  abstract getType(): string;
  abstract getDescription(): string;

  abstract doFetch(parameters: Record<string, unknown>): Promise<string>;

  /**
   * Validates the input parameters (Generic function, used in the derived classes)
   *
   * @param inputParameters the parameters to be validated. Checks if there are all required parameters provided and the type is correct.
   * Also checks if there are unnecessary arguments provided.
   *
   * @returns void
   * @throws InterpreterParameterError, if an error is found
   */
  validateParameters(inputParameters: Record<string, unknown>): void {
    let illegalArguments = false;
    let illegalArgumentsMessage = '';

    const possibleParameters: ImporterParameterDescription[] =
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
      const param = inputParameters[
        requiredParameter.name
      ] as ImporterParameterDescription;

      if (inputParameters[requiredParameter.name] === undefined) {
        illegalArguments = true;
        illegalArgumentsMessage += this.type;
        illegalArgumentsMessage += 'importer requires parameter ';
        illegalArgumentsMessage += requiredParameter.name;
        illegalArgumentsMessage += '\n';
        break;
      }
      const checkType = param.constructor.name;
      if (checkType.toLowerCase() !== requiredParameter.type) {
        illegalArguments = true;
        illegalArgumentsMessage += this.type;
        illegalArgumentsMessage += ' importer requires parameter ';
        illegalArgumentsMessage += requiredParameter.name;
        illegalArgumentsMessage += ' to be type ';
        illegalArgumentsMessage += requiredParameter.type;
        illegalArgumentsMessage += '\n';
        break;
      }
    }
    if (illegalArguments) {
      throw new ImporterParameterError(illegalArgumentsMessage);
    }
  }
}
