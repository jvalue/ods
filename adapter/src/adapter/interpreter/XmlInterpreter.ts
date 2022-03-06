import {Interpreter} from "./Interpreter";
import { InterpreterParameterDescription } from "./InterpreterParameterDescription";

export class XmlInterpreter extends Interpreter{

  override getType(): string {
    return "XML";
  }
  override getDescription(): string {
    return "Interpret data as XML data";
  }
  override getAvailableParameters(): InterpreterParameterDescription[] {
    throw new Error("Method not implemented.");
  }
  override doInterpret(data: string, parameters: Map<string, unknown>): string {
    throw new Error("Method not implemented.");
  }
 

  /*
  private final List<InterpreterParameterDescription> parameters = List.of();
  private final XmlMapper mapper = new XmlMapper();

  public XmlInterpreter() {
    mapper.registerModule(new SimpleModule().addDeserializer(Object.class, new UntypedXMLArrayDeserializer()));
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
