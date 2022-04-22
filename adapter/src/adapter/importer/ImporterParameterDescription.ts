export class ImporterParameterDescription {
  name: string;
  description: string;
  required: boolean;
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
