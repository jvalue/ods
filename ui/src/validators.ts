import { InputValidationRule } from 'vuetify';

const requiredErrorMessage = 'required.';

/**
 * This InputValidationRule for vuetify marks `null` or `undefined` or an empty string is invalid.
 * @param value the value to check
 */
export const requiredRule: InputValidationRule = value => {
  if (isNullOrUndefined(value)) {
    return requiredErrorMessage;
  }

  if (typeof value === 'string' && value.length === 0) {
    return requiredErrorMessage;
  }

  return true;
};

export function isNullOrUndefined(value: unknown | null | undefined): value is null | undefined {
  return value == null || value === undefined;
}
