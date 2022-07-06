import { InterpreterParameterError } from '../model/exceptions/InterpreterParameterError';

import { InterpreterParameterDescription } from './InterpreterParameterDescription';

/**
 * @description Abstract class for interpreters (currently supporting CSVInterpreter, JSONInterpreter and XmlInterpreter)
 */
export abstract class Interpreter {
  type: string | undefined;
  description: string | undefined;

  async interpret(
    data: string,
    parameters: Record<string, unknown>,
  ): Promise<string> {
    this.validateParameters(parameters);
    return await this.doInterpret(data, parameters);
  }

  abstract getType(): string;
  abstract getDescription(): string;
  abstract doInterpret(
    data: string,
    parameters?: Record<string, unknown>,
  ): Promise<string>;
  abstract getAvailableParameters(): InterpreterParameterDescription[];

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

    const possibleParameters: InterpreterParameterDescription[] =
      this.getAvailableParameters();

    if (possibleParameters.length === 0) {
      return;
    }

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
    const requiredParameters = this.getAvailableParameters();
    for (const requiredParameter of requiredParameters) {
      const param = inputParameters[
        requiredParameter.name
      ] as InterpreterParameterDescription;

      if (inputParameters[requiredParameter.name] === undefined) {
        illegalArguments = true;
        illegalArgumentsMessage += this.type;
        illegalArgumentsMessage += 'interpreter requires parameter ';
        illegalArgumentsMessage += requiredParameter.name;
        illegalArgumentsMessage += '\n';
        break;
      }
      const checkType = param.constructor.name;
      if (checkType.toLowerCase() !== requiredParameter.type) {
        illegalArguments = true;
        illegalArgumentsMessage += this.type;
        illegalArgumentsMessage += ' interpreter requires parameter ';
        illegalArgumentsMessage += requiredParameter.name;
        illegalArgumentsMessage += ' to be type ';
        illegalArgumentsMessage += requiredParameter.type;
        illegalArgumentsMessage += '\n';
        break;
      }
    }
    if (illegalArguments) {
      throw new InterpreterParameterError(illegalArgumentsMessage);
    }
  }
}
