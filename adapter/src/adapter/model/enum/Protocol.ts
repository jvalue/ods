import { HttpImporter } from "../../importer/HttpImporter";

export class Protocol {
  static readonly HTTP  = new HttpImporter();
  
  private constructor(private readonly key: string, public readonly value: any) {
  }

  toString() {
    return this.key;
  }
 
}