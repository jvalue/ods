import {Interpreter} from "./Interpreter";
import { InterpreterParameterDescription } from "./InterpreterParameterDescription";

export class XmlInterpreter extends Interpreter{

  parameters: InterpreterParameterDescription[] = []

  override getType(): string {
    return "XML";
  }

  override getDescription(): string {
    return "Interpret data as XML data";
  }

  override getAvailableParameters(): InterpreterParameterDescription[] {
    return this.parameters;
  }

  override doInterpret(data: string, parameters: Map<string, unknown>): string {
    return JSON.parse(data);
  }
 

  /*
  public XmlInterpreter() {
    mapper.registerModule(new SimpleModule().addDeserializer(Object.class, new UntypedXMLArrayDeserializer()));
  }

  @Override
  public JsonNode doInterpret(String data, Map<String, Object> parameters) throws IOException {
    Object result = mapper.readValue(data, Object.class);
    return mapper.valueToTree(result);
  }
   */
}
