import {Interpreter} from "./Interpreter";

export class JsonInterpreter extends Interpreter {
  doInterpret(data: string, parameters: Record<string, unknown>): string {
    throw new Error("Method not implemented.");
  }

  /*
  private final List<InterpreterParameterDescription> parameters = List.of();
  private final ObjectMapper mapper = new ObjectMapper();

  @Override
  public String getType() {
    return "JSON";
  }

  @Override
  public String getDescription() {
    return "Interpret data as JSON data";
  }

  @Override
  public List<InterpreterParameterDescription> getAvailableParameters() {
    return parameters;
  }

  @Override
  protected JsonNode doInterpret(String data, Map<String, Object> parameters) throws IOException {
    return mapper.readTree(data);
  }
}
   */
}
