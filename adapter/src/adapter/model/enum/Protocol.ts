import { HttpImporter } from "../../importer/HttpImporter";
import { Importer } from "../../importer/Importer";

export class Protocol {
  static readonly HTTP  = new HttpImporter();
  
  importer: Importer;
  constructor(importer: Importer) {
    this.importer = importer;
  }

  getImporter() {
    return this.importer
  }
}