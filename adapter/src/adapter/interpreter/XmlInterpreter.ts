import {Interpreter} from "./Interpreter";
import { InterpreterParameterDescription } from "./InterpreterParameterDescription";

export class XmlInterpreter extends Interpreter{
  getAvailableParameters(): InterpreterParameterDescription[] {
    throw new Error("Method not implemented.");
  }
  doInterpret(data: string, parameters: Map<string, unknown>): string {
    throw new Error("Method not implemented.");
  }

  /*
  private final List<InterpreterParameterDescription> parameters = List.of();
  private final XmlMapper mapper = new XmlMapper();

  public XmlInterpreter() {
    mapper.registerModule(new SimpleModule().addDeserializer(Object.class, new UntypedXMLArrayDeserializer()));
  }

  @Override
  public String getType() {
    return "XML";
  }

  @Override
  public String getDescription() {
    return "Interpret data as XML data";
  }

  @Override
  public List<InterpreterParameterDescription> getAvailableParameters() {
    return parameters;

  }

  @Override
  public JsonNode doInterpret(String data, Map<String, Object> parameters) throws IOException {
    Object result = mapper.readValue(data, Object.class);
    return mapper.valueToTree(result);
  }
   */
}