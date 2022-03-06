import {Interpreter} from "./Interpreter";
import { InterpreterParameterDescription } from "./InterpreterParameterDescription";
const xml2js = require('xml2js');

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
    xml2js.parseString(data, (err: any, result: any) => {
      if(err) {
          throw err;
      }
  
      // `result` is a JavaScript object
      // convert it to a JSON string
      const json = JSON.stringify(result);
      return json;
    });
    throw Error("could not convert data into json");
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
