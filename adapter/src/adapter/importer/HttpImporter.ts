import axios, { AxiosError } from 'axios';

import { ImporterParameterError } from '../model/exceptions/ImporterParameterError';

import { Importer } from './Importer';
import { ImporterParameterDescription } from './ImporterParameterDescription';

export class HttpImporter extends Importer {
  type = 'HTTP';
  description = 'Plain HTTP';
  parameters: ImporterParameterDescription[] = [
    new ImporterParameterDescription({
      name: 'location',
      description: 'String of the URI for the HTTP call',
      type: 'string',
    }),
    new ImporterParameterDescription({
      name: 'encoding',
      description:
        'Encoding of the source. Available encodings: ISO-8859-1, US-ASCII, UTF-8',
      type: 'string',
    }),
    new ImporterParameterDescription({
      name: 'defaultParameters',
      description: 'Default values for open parameters in the URI',
      required: false,
      type: 'RuntimeParameters',
    }),
  ];

  override getType(): string {
    return this.type;
  }

  override getDescription(): string {
    return this.description;
  }

  override getAvailableParameters(): ImporterParameterDescription[] {
    return this.parameters;
  }

  /**
   * Validates the input parameters (options).
   *
   * @param inputParameters option parameters. Checks if the encoding format is correct.
   * @returns void
   * @throws Error, if encoding is invalid
   */
  override validateParameters(inputParameters: Record<string, unknown>): void {
    super.validateParameters(inputParameters);
    const encoding: string = inputParameters.encoding as string;

    if (
      encoding !== 'ISO-8859-1' &&
      encoding !== 'US-ASCII' &&
      encoding !== 'UTF-8'
    ) {
      throw new Error(
        this.getType() +
          ' interpreter requires parameter encoding to have value ' +
          'ISO-8859-1' +
          ', ' +
          'US-ASCII' +
          ', ' +
          'UTF-8' +
          '. Your given value ' +
          encoding +
          ' is invalid!',
      );
    }
  }

  /**
   * Retrieves the data via HTTP, provided in the "location" parameter
   * Uses axios to perform the HTTP GET method
   *
   * @param parameters Parameters necessary for executing the HTTP GET
   * @returns data as a string representation in a promise object
   * @throws ImporterParameterError, if location is invalid
   * @throws Error if Location-URI returns 404 status code
   */
  override async doFetch(parameters: Record<string, unknown>): Promise<string> {
    let uri = parameters.location as string;
    const encoding = parameters.encoding as string;
    // Originally this was done in dataImportTrigger during creation of AdapterConfig
    // -> RuntimeParameter are used, because the defaultParams are overriden during AdapterConfig instead
    if (parameters.defaultParameters !== undefined) {
      const defaultParameters = parameters.defaultParameters as Record<
        string,
        unknown
      >;

      const keys = Object.keys(defaultParameters);
      for (const entry of keys) {
        const value = defaultParameters[entry] as string;
        const regex = new RegExp('{' + entry + '}', 'g');
        uri = uri.replace(regex, value);
      }
    }

    // The old impl retrieved data as byte array and then converted using encoding:
    // Return new String(rawResponse, Charset.forName((String) parameters.get("encoding")));
    // Unfortunately there does not seem to be a universal method .toString(encoding?: string) in javascript
    const result = await axios
      .get(uri, { responseEncoding: encoding })
      .catch((error: AxiosError) => {
        if (error.response) {
          console.log(error.response);
          throw new Error('Could not Fetch from URI:' + uri);
        }
        throw new ImporterParameterError('Could not Fetch from URI:' + uri);
      });
    // Check if data is object/array -> return stringified (because this method returns string)
    if (typeof result.data === 'object' || Array.isArray(result.data)) {
      return JSON.stringify(result.data);
    }
    return result.data as string;
  }
}
