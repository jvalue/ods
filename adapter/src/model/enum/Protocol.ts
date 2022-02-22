export class Protocol {
  //static readonly HTTP  = new HttpImporter(new Resttemplate);
  

  // private to disallow creating other instances of this type
  private constructor(private readonly key: string, public readonly value: any) {
  }

  toString() {
    return this.key;
  }
  
}

/*
 HTTP(new HttpImporter(new RestTemplate()));

  private final Importer importer;

  Protocol(Importer importer) {
    this.importer = importer;
  }

  Importer getImporter() {
    return importer;
  }
*/
