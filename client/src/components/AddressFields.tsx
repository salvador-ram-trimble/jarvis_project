import { ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';
import { ADDRESS_FIELDS, type Address } from '@jarvis/shared';
import { inputValue, type FieldFeedback } from './formFields';

export type AddressValues = Required<Address>;

const ADDRESS_LABELS: Record<keyof Address, string> = {
  street: 'Street',
  city: 'City',
  state: 'State / region',
  postalCode: 'Postal code',
  country: 'Country',
};

/** Every field of an address as text, blank when not set. */
export function toAddressValues(address: Address | undefined): AddressValues {
  const values = {} as AddressValues;
  for (const field of ADDRESS_FIELDS) {
    values[field] = address?.[field] ?? '';
  }
  return values;
}

/** Every field, trimmed. The API stores an address with nothing filled in as no address. */
export function trimAddress(values: AddressValues): AddressValues {
  const address = {} as AddressValues;
  for (const field of ADDRESS_FIELDS) {
    address[field] = values[field].trim();
  }
  return address;
}

interface AddressFieldsProps {
  legend: string;
  /** Prefix for the input ids, and the field name the API reports errors under (`<name>.<field>`). */
  name: string;
  idPrefix: string;
  values: AddressValues;
  feedback: (errorKey: string) => FieldFeedback;
  onChange: (field: keyof Address, value: string) => void;
}

/** The five address inputs in a fieldset. */
export function AddressFields({ legend, name, idPrefix, values, feedback, onChange }: AddressFieldsProps) {
  return (
    <fieldset className="form-fieldset">
      <legend>{legend}</legend>
      {ADDRESS_FIELDS.map((field) => (
        <ModusWcTextInput
          key={field}
          label={ADDRESS_LABELS[field]}
          name={field}
          inputId={`${idPrefix}-${field}`}
          value={values[field]}
          feedback={feedback(`${name}.${field}`)}
          onInputChange={(e) => onChange(field, inputValue(e))}
        />
      ))}
    </fieldset>
  );
}
