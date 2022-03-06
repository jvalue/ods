import {Interpreter} from "./Interpreter";
import { InterpreterParameterDescription } from "./InterpreterParameterDescription";


export class CsvInterpreter extends Interpreter {

  parameters: InterpreterParameterDescription[] = [new InterpreterParameterDescription("columnSeparator", "Column delimiter character, only one character supported", "string"),
                                                  new InterpreterParameterDescription("lineSeparator", "Line delimiter character, only \\r, \\r\\n, and \\n supported", "string",),
                                                  new InterpreterParameterDescription("skipFirstDataRow", "Skip first data row (after header)", "boolean"),
                                                  new InterpreterParameterDescription("firstRowAsHeader", "Interpret first row as header for columns", "boolean")]

                                                  

  override getType(): string {
    return "CSV"
  }
  override getDescription(): string {
    return "Interpret data as CSV data";
  }
  override getAvailableParameters(): InterpreterParameterDescription[] {
    return this.parameters;
  }
  /*
    @Override
  protected JsonNode doInterpret(String data, Map<String, Object> parameters) throws IOException {
    CsvSchema csvSchema = createSchema(parameters);
    if ((boolean) parameters.get("firstRowAsHeader")) {
      return parseWithHeader(data, csvSchema);
    } else {
      return parseWithoutHeader(data, csvSchema);
    }
  }
  */
  override doInterpret(data: string, parameters: Map<string, unknown>): string {
    let columnSeparator = (parameters.get("columnSeparator") as string).charAt(0)
    let lineSeparator: string = parameters.get("lineSeparator") as string;
    let skipFirstDataRow: boolean = parameters.get("skipFirstDataRow") as boolean;

    var result = [];
    var lines = data.split(lineSeparator);
    var headers = lines[0].split(",");

    for(var i=1; i<lines.length; i++) {

      var obj = {};
      var currentline = lines[i].split(lineSeparator);
  
      for(var j=0; j<headers.length; j++){
        obj [headers[j]] = currentline[j];
        obj["asdasd"] = currentline[j]
      }
  
      result.push(obj);
    }
    

   

    return JSON.stringify(result);
  }

  /*
    @Override
  protected void validateParameters(Map<String, Object> inputParameters) throws InterpreterParameterException {
    super.validateParameters(inputParameters);

    String lineSeparator = (String) inputParameters.get("lineSeparator");
    if (!lineSeparator.equals("\n") && !lineSeparator.equals("\r") && !lineSeparator.equals("\r\n")) {
      throw new InterpreterParameterException(getType() + " interpreter requires parameter lineSeparator to have" +
        " value \\n, \\r, or \\r\\n. Your given value " + lineSeparator + " is invalid!");
    }

    String columnSeparator = (String) inputParameters.get("columnSeparator");
    if (columnSeparator.length() != 1) {
      throw new InterpreterParameterException(getType() + " interpreter requires parameter columnSeparator to have" +
        " length 1. Your given value " + columnSeparator + " is invalid!");
    }
  }
  */
  override validateParameters(inputParameters: Map<string, unknown>): void {
      super.validateParameters(inputParameters);
      let lineSeparator: string = inputParameters.get("lineSeparator") as string;

      if (lineSeparator !== "\n" && lineSeparator !== "\r" && lineSeparator !== "\r\n") {
        throw new Error(this.getType() + " interpreter requires parameter lineSeparator to have" +
          " value \\n, \\r, or \\r\\n. Your given value " + lineSeparator + " is invalid!");
      }

      var columnSeparator: string = inputParameters.get("columnSeparator") as string;
      if (columnSeparator.length !== 1) {
      throw new Error(this.getType() + " interpreter requires parameter columnSeparator to have" +
        " length 1. Your given value " + columnSeparator + " is invalid!");
    }
  }

  /*  
  private CsvSchema createSchema(Map<String, Object> parameters) {
    CsvSchema csvSchema = CsvSchema
      .emptySchema()
      .withColumnSeparator(((String) parameters.get("columnSeparator")).charAt(0))
      .withLineSeparator((String) parameters.get("lineSeparator"))
      .withSkipFirstDataRow((boolean) parameters.get("skipFirstDataRow"));
    if ((boolean) parameters.get("firstRowAsHeader")) {
      csvSchema = csvSchema
        .withHeader();
    }
    return csvSchema;
  }

  private JsonNode parseWithoutHeader(String data, CsvSchema csvSchema) throws IOException {
    MappingIterator<Object[]> allLines = mapper
      .readerFor(Object[].class)
      .with(csvSchema)
      .readValues(data);

    ArrayNode result = mapper.createArrayNode();
    while (allLines.hasNext()) {
      result.add(jsonMapper.valueToTree(allLines.next()));
    }

    return result;
  }

  private JsonNode parseWithHeader(String data, CsvSchema csvSchema) throws IOException {
    MappingIterator<Map<String, String>> allLines = mapper
      .readerFor(Map.class)
      .with(csvSchema)
      .readValues(data);

    ArrayNode result = mapper.createArrayNode();
    while (allLines.hasNext()) {
      result.add(jsonMapper.valueToTree(allLines.next()));
    }

    return result;
  }
   */
}
