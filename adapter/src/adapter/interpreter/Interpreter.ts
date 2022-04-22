import { InterpreterParameterError } from '../model/exceptions/InterpreterParameterError';

import { InterpreterParameterDescription } from './InterpreterParameterDescription';

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
  abstract getAvailableParameters(): Array<InterpreterParameterDescription>;

  validateParameters(inputParameters: Record<string, unknown>): void {
    let illegalArguments = false;
    let illegalArgumentsMessage = '';

    const possibleParameters: Array<InterpreterParameterDescription> =
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

    for (const requiredParameter of this.getAvailableParameters()) {
      const param = inputParameters[
        requiredParameter.name
      ] as InterpreterParameterDescription;

      if (param === undefined) {
        illegalArguments = true;
        illegalArgumentsMessage += this.type;
        illegalArgumentsMessage += 'interpreter requires parameter ';
        illegalArgumentsMessage += requiredParameter.name;
        illegalArgumentsMessage += '\n';
      }
    }
    if (illegalArguments) {
      throw new InterpreterParameterError(illegalArgumentsMessage);
    }
  }
}
