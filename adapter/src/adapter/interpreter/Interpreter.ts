import { InterpreterParameterError } from '../model/exceptions/InterpreterParameterError';

export interface InterpreterParameterDescription {
  name: string;
  description: string;
  required: boolean;
  type: unknown;
}

/**
 * @description Abstract class for interpreters (currently supporting CSVInterpreter, JSONInterpreter and XmlInterpreter)
 */
export abstract class Interpreter {
  constructor(public type: string, public description: string) {}

  abstract doInterpret(
    data: string,
    parameters?: Record<string, unknown>,
  ): Promise<Record<string, unknown> | Array<Record<string, unknown>>>;

  abstract getAvailableParameters(): InterpreterParameterDescription[];

  /**
   * Interprets data and returns the result
   * @param data data as a string
   * @param parameters additional parameters
   * @returns the interpreted data
   */
  async interpret(
    data: string,
    parameters: Record<string, unknown>,
  ): Promise<Record<string, unknown> | Array<Record<string, unknown>>> {
    this.validateParameters(parameters);
    return await this.doInterpret(data, parameters);
  }

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
