import axios from 'axios';

import { ImporterParameterError } from '../model/exceptions/ImporterParameterError';

import { Importer } from './Importer';
import { ImporterParameterDescription } from './ImporterParameterDescription';

export class HttpImporter extends Importer {
  // TODO RuntimeParameters type is probably wrong
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

  // Override annotation is not necessary, but will be used for a better understanding of the code
  override getType(): string {
    return this.type;
  }

  override getDescription(): string {
    return this.description;
  }

  override getAvailableParameters(): ImporterParameterDescription[] {
    return this.parameters;
  }

  override validateParameters(inputParameters: Record<string, unknown>): void {
    super.validateParameters(inputParameters);
    const encoding: string = inputParameters.encoding as string;

    // TODO CHECK IF ENCODING ARE WRITTEN CORRECT
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

  override async doFetch(parameters: Record<string, unknown>): Promise<string> {
    const uri = parameters.location as string;
    const encoding = parameters.encoding as string;
    // TODO see if encoding from response is good
    return axios({
      method: 'get',
      url: uri,
      responseEncoding: encoding,
    })
      .then(function (response: any) {
        console.log(response.data);
        return response.data as string;
      })
      .catch(function (error: any) {
        console.error(error);
        throw new ImporterParameterError('Could not Fetch from URI:' + uri);
      });
  }
}
