import {Interpreter} from "./Interpreter";
import { InterpreterParameterDescription } from "./InterpreterParameterDescription";

export class JsonInterpreter extends Interpreter {

  override getType(): string {
    return "JSON";
  }
  override getDescription(): string {
    return "Interpret data as JSON data";
  }
  override getAvailableParameters(): InterpreterParameterDescription[] {
    throw new Error("Method not implemented.");
  }
  override doInterpret(data: string, parameters: Map<string, unknown>): string {
    throw new Error("Method not implemented.");
  }

  /*
  private final List<InterpreterParameterDescription> parameters = List.of();
  private final ObjectMapper mapper = new ObjectMapper();

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
