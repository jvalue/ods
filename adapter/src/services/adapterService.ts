import { Interpreter } from "../model/interpreter";

export class AdapterService {
    /**
     * @description Create an instance of AdapterService
     */
    constructor () {
    }
  
    // To Implement
    static getAllFormats(): Array<Interpreter> {
      try {
        let interpreters: Interpreter[] = [new Interpreter("TYPE_TEST", "Dies ist eine Beschreibung")]
        return interpreters
      } catch ( err ) {
        throw err
      }
    }
  }

  module.exports = AdapterService;