export class InterpreterParameterDescription{

    name: string;
    description: string;
    required: boolean | undefined;
    type: unknown;

    constructor (name: string, description: string, type: unknown) {
        this.name = name;
        this.description = description;
        this.type  = type;
    }
}