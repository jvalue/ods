export class ImporterParameterDescription {
  name: string;
  description: string;
  required: boolean;

  // TODO @Georg: need to check how to store the class in typescript, can use instance.constructor.name to get the name probably -> is stored as string
  type: unknown;

  constructor({
    name,
    description,
    required = true,
    type,
  }: {
    name: string;
    description: string;
    required?: boolean;
    type: unknown;
  }) {
    this.name = name;
    this.description = description;
    this.required = required;
    this.type = type;
  }
}
