import { Importer } from "./Importer";
import { ImporterParameterDescription } from "./ImporterParameterDescription";

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
    override doFetch(parameters: Map<string, unknown>): string {
        throw new Error("Method not implemented.");
    }

    /*
  @Override
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

  @Override
  public List<ImporterParameterDescription> getAvailableParameters() {
    return parameters;
  }

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