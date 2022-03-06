export class InterpreterParameterDescription{

    name: string;
    description: string;
    // TODO default value? is not used in Interpreters
    required: boolean | undefined;
    //TODO @Georg: need to check how to store the class in typescript, can use instance.constructor.name to get the name probably -> is stored as string -> Same as in Importer
    type: unknown;

    constructor (name: string, description: string, type: unknown) {
        this.name = name;
        this.description = description;
        this.type  = type;
    }
}