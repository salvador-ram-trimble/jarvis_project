import { ModusWcAlert, ModusWcButton, ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';
import { useRef, useState, type FormEvent } from 'react';
import type { CustomerInput, FieldErrors } from '@jarvis/shared';
import type { ApiError } from '../api/client';

interface CustomerFormProps {
  submitLabel: string;
  submitting: boolean;
  /** The error from the last submit, if it failed. Its field errors are shown next to the fields. */
  serverError: ApiError | null;
  onSubmit: (input: CustomerInput) => void;
  onCancel: () => void;
}

/** Mirrors the server's rules so the user gets feedback before submitting. */
function validate(input: CustomerInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.name.trim()) {
    errors.name = 'Name is required';
  }
  return errors;
}

export function CustomerForm({ submitLabel, submitting, serverError, onSubmit, onCancel }: CustomerFormProps) {
  const [values, setValues] = useState<CustomerInput>({ name: '' });
  // Modus inputs report changes through custom events, and React renders those on a later tick than
  // native input events. Submitting reads this ref so pressing Enter right after typing sends every character.
  const latestValues = useRef(values);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  function setField<K extends keyof CustomerInput>(field: K, value: CustomerInput[K]) {
    latestValues.current = { ...latestValues.current, [field]: value };
    setValues(latestValues.current);
  }

  // Client-side errors win; otherwise show what the server rejected.
  const fieldErrors = Object.keys(clientErrors).length > 0 ? clientErrors : (serverError?.fields ?? {});
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input = { name: latestValues.current.name.trim() };
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
        feedback={fieldErrors.name ? { level: 'error', message: fieldErrors.name } : undefined}
        onInputChange={(e) => setField('name', (e.detail.target as HTMLInputElement).value)}
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
