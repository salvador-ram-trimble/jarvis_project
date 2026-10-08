import {
  ModusWcAlert,
  ModusWcButton,
  ModusWcTextarea,
  ModusWcTextInput,
} from '@trimble-oss/moduswebcomponents-react';
import { useRef, useState, type FormEvent } from 'react';
import {
  isValidEmail,
  validationMessages,
  type Customer,
  type CustomerInput,
  type FieldErrors,
} from '@jarvis/shared';
import type { ApiError } from '../api/client';
import { AddressFields, toAddressValues, trimAddress, type AddressValues } from './AddressFields';
import { feedbackFor, inputValue } from './formFields';

interface CustomerFormProps {
  /** The customer being edited. Leave it out to create a new one. */
  initialCustomer?: Customer;
  submitLabel: string;
  submitting: boolean;
  /** The error from the last submit, if it failed. Its field errors are shown next to the fields. */
  serverError: ApiError | null;
  onSubmit: (input: CustomerInput) => void;
  onCancel: () => void;
}

/** Every input's text. Address fields are stored flat and grouped again on submit. */
type FormValues = Required<Omit<CustomerInput, 'address'>> & AddressValues;

function toFormValues(customer?: Customer): FormValues {
  return {
    name: customer?.name ?? '',
    company: customer?.company ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    notes: customer?.notes ?? '',
    ...toAddressValues(customer?.address),
  };
}

/**
 * Every field is sent, trimmed, so that clearing a field on the edit page clears it on the server too
 * (the API treats a blank string as "not set").
 */
function toInput(values: FormValues): CustomerInput {
  return {
    name: values.name.trim(),
    company: values.company.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    address: trimAddress(values),
    notes: values.notes.trim(),
  };
}

/** Mirrors the server's rules so the user gets feedback before submitting. */
function validate(input: CustomerInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.name) {
    errors.name = validationMessages.nameRequired;
  }
  if (input.email && !isValidEmail(input.email)) {
    errors.email = validationMessages.emailInvalid;
  }
  return errors;
}

export function CustomerForm({
  initialCustomer,
  submitLabel,
  submitting,
  serverError,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(initialCustomer));
  // Modus inputs report changes through custom events, and React renders those on a later tick than
  // native input events. Submitting reads this ref so pressing Enter right after typing sends every character.
  const latestValues = useRef(values);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  function setField(field: keyof FormValues, value: string) {
    latestValues.current = { ...latestValues.current, [field]: value };
    setValues(latestValues.current);
  }

  // Client-side errors win; otherwise show what the server rejected.
  const fieldErrors = Object.keys(clientErrors).length > 0 ? clientErrors : (serverError?.fields ?? {});
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const feedback = feedbackFor(fieldErrors);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input = toInput(latestValues.current);
    const errors = validate(input);
    setClientErrors(errors);
    if (Object.keys(errors).length === 0) {
      onSubmit(input);
    }
  }

  return (
    <form className="form" noValidate onSubmit={handleSubmit}>
      {serverError && !hasFieldErrors && (
        <ModusWcAlert variant="error" alertTitle="Could not save the customer" alertDescription={serverError.message} />
      )}
      <ModusWcTextInput
        label="Name"
        name="name"
        inputId="customer-name"
        required
        value={values.name}
        feedback={feedback('name')}
        onInputChange={(e) => setField('name', inputValue(e))}
      />
      <ModusWcTextInput
        label="Company"
        name="company"
        inputId="customer-company"
        value={values.company}
        feedback={feedback('company')}
        onInputChange={(e) => setField('company', inputValue(e))}
      />
      <div className="form-row">
        <ModusWcTextInput
          label="Email"
          name="email"
          inputId="customer-email"
          type="email"
          value={values.email}
          feedback={feedback('email')}
          onInputChange={(e) => setField('email', inputValue(e))}
        />
        <ModusWcTextInput
          label="Phone"
          name="phone"
          inputId="customer-phone"
          type="tel"
          value={values.phone}
          feedback={feedback('phone')}
          onInputChange={(e) => setField('phone', inputValue(e))}
        />
      </div>
      <AddressFields
        legend="Address"
        name="address"
        idPrefix="customer-address"
        values={values}
        feedback={feedback}
        onChange={setField}
      />
      <ModusWcTextarea
        label="Notes"
        name="notes"
        inputId="customer-notes"
        rows={4}
        value={values.notes}
        feedback={feedback('notes')}
        onInputChange={(e) => setField('notes', inputValue(e))}
      />
      <div className="form-actions">
        <ModusWcButton type="submit" disabled={submitting}>
          {submitLabel}
        </ModusWcButton>
        <ModusWcButton type="button" variant="outlined" onButtonClick={onCancel}>
          Cancel
        </ModusWcButton>
      </div>
    </form>
  );
}
