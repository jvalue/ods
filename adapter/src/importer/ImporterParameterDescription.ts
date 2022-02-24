export class ImporterParameterDescription {
    name: string | undefined;
    description: string | undefined;
    required: boolean | undefined;
    type: unknown;

    constructor (name: string, description: string, type: unknown) {
        this.name = name;
        this.description = description;
        this.type  = type;
    }
}