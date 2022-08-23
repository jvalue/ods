import axios, { AxiosError } from 'axios';

import { ImporterParameterError } from '../exceptions/ImporterParameterError';

import { Importer } from './Importer';

export class HttpImporter extends Importer {
  constructor() {
    super('HTTP', 'Plain HTTP', [
      {
        name: 'location',
        description: 'String of the URI for the HTTP call',
        required: true,
        type: 'string',
      },
      {
        name: 'encoding',
        description:
          'Encoding of the source. Available encodings: ISO-8859-1, US-ASCII, UTF-8',
        required: true,
        type: 'string',
      },
      {
        name: 'defaultParameters',
        description: 'Default values for open parameters in the URI',
        required: false,
        type: 'RuntimeParameters',
      },
    ]);
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
      const type: string = this.type;
      throw new Error(
        `${type} interpreter requires parameter encoding to have value ISO-8859-1, US-ASCII, UTF-8. Your given value ${encoding} is invalid!`,
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
    const uri = parameters.location as string;
    const encoding = parameters.encoding as string;

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
