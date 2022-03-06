import { ImporterParameterError } from "../model/exceptions/ImporterParameterError";
import { Importer } from "./Importer";
import { ImporterParameterDescription } from "./ImporterParameterDescription";
const axios = require('axios');

export class HttpImporter extends Importer {

  //TODO RuntimeParameters type is probably wrong
  parameters = [new ImporterParameterDescription({name:"location", description:"String of the URI for the HTTP call", type:"string"}), 
                new ImporterParameterDescription({name:"encoding", description:"Encoding of the source. Available encodings: ISO-8859-1, US-ASCII, UTF-8", type:"string"}),
                new ImporterParameterDescription({name:"defaultParameters", description:"Default values for open parameters in the URI", required:false, type:"RuntimeParameters"})]

    // Override annotation is not necessary, but will be used for a better understanding of the code
    override getType(): string {
      return "HTTP";
    }
    
    override getDescription(): string {
      return "Plain HTTP";
    }
    
    override getAvailableParameters(): ImporterParameterDescription[] {
        return this.parameters;
    }

    override validateParameters(inputParameters: Map<string, unknown>): void {
        super.validateParameters(inputParameters);
        let encoding = inputParameters.get("encoding");

        // TODO CHECK IF ENCODING ARE WRITTEN CORRECT
        if (encoding !== "ISO-8859-1" && encoding !== "US-ASCII"  && encoding !== "UTF-8") {
          throw new Error(this.getType() + " interpreter requires parameter encoding to have value " +
            "ISO-8859-1" + ", " +
            "US-ASCII" + ", " +
            "UTF-8"
            + ". Your given value " + encoding + " is invalid!");
        }
    }
    /**
    protected void validateParameters(Map<String, Object> inputParameters) throws ImporterParameterException {
      super.validateParameters(inputParameters);

      String encoding = (String) inputParameters.get("encoding");
      if (!encoding.equals(StandardCharsets.ISO_8859_1.name()) && !encoding.equals(StandardCharsets.US_ASCII.name()) && !encoding.equals(StandardCharsets.UTF_8.name())) {
        throw new IllegalArgumentException(getType() + " interpreter requires parameter encoding to have value " +
          StandardCharsets.ISO_8859_1 + ", " +
          StandardCharsets.US_ASCII + ", " +
          StandardCharsets.UTF_8
          + ". Your given value " + encoding + " is invalid!");
      }
    } 
     */
    override doFetch(parameters: Map<string, unknown>): string {
        let uri = parameters.get("location")
        let encoding = parameters.get("encoding")
        // TODO see if encoding from response is good
        axios({
          method: 'get',
          url: uri,
          responseEncoding: encoding
        }).then(function (response: any) {
          console.log(response.data)
          return response.data
        }).catch(function (error: any) {
          console.error(error)
          throw new ImporterParameterError("Could not Fetch from URI:" + uri)
        });
        throw new ImporterParameterError("Could not Fetch from URI:" + uri)
    }

    /*

     @Override
  protected String doFetch(Map<String, Object> parameters) throws ImporterParameterException {
    String location = parameters.get("location").toString();
    try {
      URI uri = URI.create(location);
      byte[] rawResponse = restTemplate.getForEntity(uri, byte[].class).getBody();
      return new String(rawResponse, Charset.forName((String) parameters.get("encoding")));
    } catch (IllegalArgumentException e) {
      throw new ImporterParameterException(e.getMessage());
    }
  }
     */

}