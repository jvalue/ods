import csv from 'csvtojson';

import { Interpreter } from './Interpreter';
import { InterpreterParameterDescription } from './InterpreterParameterDescription';

export class CsvInterpreter extends Interpreter {
  type = 'CSV';

  description = 'Interpret data as CSV data';
  parameters: InterpreterParameterDescription[] = [
    new InterpreterParameterDescription(
      'columnSeparator',
      'Column delimiter character, only one character supported',
      'string',
    ),
    new InterpreterParameterDescription(
      'lineSeparator',
      'Line delimiter character, only \\r, \\r\\n, and \\n supported',
      'string',
    ),
    new InterpreterParameterDescription(
      'skipFirstDataRow',
      'Skip first data row (after header)',
      'boolean',
    ),
    new InterpreterParameterDescription(
      'firstRowAsHeader',
      'Interpret first row as header for columns',
      'boolean',
    ),
  ];

  override getType(): string {
    return this.type;
  }
  override getDescription(): string {
    return this.description;
  }
  override getAvailableParameters(): InterpreterParameterDescription[] {
    return this.parameters;
  }

  /**
   * Interpretes the csv data
   * Uses csvtojson library to convert the csv to corresponding json object
   *
   * @param data string representation of the csv data
   * @param parameters options, for interpreting the data: Possible options: columnSeparator, lineSeparator, firstRowAsHeader, skipFirstDataRow
   * @returns JSON string representation as Promise
   */
  override async doInterpret(
    data: string,
    parameters: Record<string, unknown>,
  ): Promise<Record<string, unknown> | Array<Record<string, unknown>>> {
    const columnSeparator = (parameters.columnSeparator as string).charAt(0);
    const lineSeparator: string = parameters.lineSeparator as string;
    // Be Careful: Need to Invert the boolean here
    // True = With header, False = WithoutHeader
    const firstRowAsHeader = !(parameters.firstRowAsHeader as boolean);
    const skipFirstDataRow: boolean = parameters.skipFirstDataRow as boolean;

    const csvConverterResult = await csv({
      noheader: firstRowAsHeader,
      output: 'json',
      delimiter: columnSeparator,
      eol: lineSeparator,
    }).fromString(data);
    if (skipFirstDataRow) {
      csvConverterResult.splice(0, 1);
    }
    return Promise.resolve(csvConverterResult);
  }

  /**
   * Validates the input parameters (options).
   *
   * @param inputParameters option parameters. Possible options: columnSeparator, lineSeparator, firstRowAsHeader, skipFirstDataRow
   * @returns void
   * @throws Error, if lineSeperator or columnSeparator is invalid
   */
  override validateParameters(inputParameters: Record<string, unknown>): void {
    super.validateParameters(inputParameters);
    const lineSeparator: string = inputParameters.lineSeparator as string;

    if (
      lineSeparator !== '\n' &&
      lineSeparator !== '\r' &&
      lineSeparator !== '\r\n'
    ) {
      throw new Error(
        this.getType() +
          ' interpreter requires parameter lineSeparator to have' +
          ' value \\n, \\r, or \\r\\n. Your given value ' +
          lineSeparator +
          ' is invalid!',
      );
    }

    const columnSeparator: string = inputParameters.columnSeparator as string;
    if (columnSeparator.length !== 1) {
      throw new Error(
        this.getType() +
          ' interpreter requires parameter columnSeparator to have' +
          ' length 1. Your given value ' +
          columnSeparator +
          ' is invalid!',
      );
    }
  }
}
