import {
  ModusWcAlert,
  ModusWcButton,
  ModusWcDate,
  ModusWcNumberInput,
  ModusWcSelect,
  ModusWcTextarea,
  ModusWcTextInput,
} from '@trimble-oss/moduswebcomponents-react';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import {
  DEFAULT_JOB_STATUS,
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  isEndBeforeStart,
  isValidDate,
  isValidPrice,
  validationMessages,
  type Customer,
  type FieldErrors,
  type Job,
  type JobInput,
  type JobStatus,
} from '@jarvis/shared';
import type { ApiError } from '../api/client';
import { AddressFields, toAddressValues, trimAddress, type AddressValues } from './AddressFields';
import { feedbackFor, inputValue } from './formFields';

interface JobFormProps {
  /** Every customer, for the customer picker. */
  customers: Customer[];
  /** The job being edited. Leave it out to create a new one. */
  initialJob?: Job;
  /** For a new job, the customer to start with. Their address fills in the site address. */
  initialCustomerId?: string;
  submitLabel: string;
  submitting: boolean;
  /** The error from the last submit, if it failed. Its field errors are shown next to the fields. */
  serverError: ApiError | null;
  onSubmit: (input: JobInput) => void;
  onCancel: () => void;
}

/** Every input's text. Site address fields are stored flat and grouped again on submit. */
interface FormValues extends AddressValues {
  title: string;
  customerId: string;
  status: JobStatus;
  description: string;
  scheduledStart: string;
  scheduledEnd: string;
  price: string;
}

const STATUS_OPTIONS = JOB_STATUSES.map((status) => ({ value: status, label: JOB_STATUS_LABELS[status] }));

function toFormValues(job: Job | undefined, initialCustomer: Customer | undefined): FormValues {
  if (job) {
    return {
      title: job.title,
      customerId: job.customer.id,
      status: job.status,
      description: job.description ?? '',
      scheduledStart: job.scheduledStart ?? '',
      scheduledEnd: job.scheduledEnd ?? '',
      price: job.price === undefined ? '' : String(job.price),
      ...toAddressValues(job.siteAddress),
    };
  }
  return {
    title: '',
    customerId: initialCustomer?.id ?? '',
    status: DEFAULT_JOB_STATUS,
    description: '',
    scheduledStart: '',
    scheduledEnd: '',
    price: '',
    ...toAddressValues(initialCustomer?.address),
  };
}

/**
 * Every field is sent, trimmed, so that clearing a field on the edit page clears it on the server too
 * (the API treats a blank string, or a null price, as "not set"). An unreadable price becomes NaN, which
 * `validate` rejects.
 */
function toInput(values: FormValues): JobInput {
  const price = values.price.trim();
  return {
    title: values.title.trim(),
    customerId: values.customerId,
    status: values.status,
    description: values.description.trim(),
    scheduledStart: values.scheduledStart.trim(),
    scheduledEnd: values.scheduledEnd.trim(),
    siteAddress: trimAddress(values),
    price: price === '' ? null : Number(price),
  };
}

/** Mirrors the server's rules so the user gets feedback before submitting. */
function validate(input: JobInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.title) {
    errors.title = validationMessages.titleRequired;
  }
  if (!input.customerId) {
    errors.customerId = validationMessages.customerRequired;
  }
  for (const field of ['scheduledStart', 'scheduledEnd'] as const) {
    const date = input[field];
    if (date && !isValidDate(date)) {
      errors[field] = validationMessages.dateInvalid;
    }
  }
  if (!errors.scheduledStart && !errors.scheduledEnd && isEndBeforeStart(input.scheduledStart, input.scheduledEnd)) {
    errors.scheduledEnd = validationMessages.endBeforeStart;
  }
  if (input.price != null && !isValidPrice(input.price)) {
    errors.price = Number.isNaN(input.price) ? validationMessages.priceInvalid : validationMessages.priceNegative;
  }
  return errors;
}

export function JobForm({
  customers,
  initialJob,
  initialCustomerId,
  submitLabel,
  submitting,
  serverError,
  onSubmit,
  onCancel,
}: JobFormProps) {
  const [values, setValues] = useState<FormValues>(() =>
    toFormValues(
      initialJob,
      customers.find((customer) => customer.id === initialCustomerId),
    ),
  );
  // Modus inputs report changes through custom events, and React renders those on a later tick than
  // native input events. Submitting reads this ref so pressing Enter right after typing sends every character.
  const latestValues = useRef(values);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  function setFields(changes: Partial<FormValues>) {
    latestValues.current = { ...latestValues.current, ...changes };
    setValues(latestValues.current);
  }

  function setField(field: keyof FormValues, value: string) {
    setFields({ [field]: value });
  }

  /** Choosing a customer copies their address into the site address, which the user can then change. */
  function selectCustomer(customerId: string) {
    const customer = customers.find((candidate) => candidate.id === customerId);
    setFields({ customerId, ...toAddressValues(customer?.address) });
  }

  const customerOptions = useMemo(
    () => [
      { value: '', label: 'Select a customer' },
      ...[...customers]
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }))
        .map((customer) => ({
          value: customer.id,
          label: customer.company ? `${customer.name} (${customer.company})` : customer.name,
        })),
    ],
    [customers],
  );

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
        <ModusWcAlert variant="error" alertTitle="Could not save the job" alertDescription={serverError.message} />
      )}
      <ModusWcTextInput
        label="Title"
        name="title"
        inputId="job-title"
        required
        value={values.title}
        feedback={feedback('title')}
        onInputChange={(e) => setField('title', inputValue(e))}
      />
      <div className="form-row">
        <ModusWcSelect
          label="Customer"
          name="customerId"
          inputId="job-customer"
          required
          options={customerOptions}
          value={values.customerId}
          feedback={feedback('customerId')}
          onInputChange={(e) => selectCustomer(inputValue(e))}
        />
        <ModusWcSelect
          label="Status"
          name="status"
          inputId="job-status"
          required
          options={STATUS_OPTIONS}
          value={values.status}
          feedback={feedback('status')}
          onInputChange={(e) => setField('status', inputValue(e))}
        />
      </div>
      <div className="form-row">
        <ModusWcDate
          label="Scheduled start"
          name="scheduledStart"
          inputId="job-scheduled-start"
          value={values.scheduledStart}
          feedback={feedback('scheduledStart')}
          onInputChange={(e) => setField('scheduledStart', inputValue(e))}
        />
        <ModusWcDate
          label="Scheduled end"
          name="scheduledEnd"
          inputId="job-scheduled-end"
          // No `min`: Modus would silently move an earlier end date up to it, instead of the form saying why.
          value={values.scheduledEnd}
          feedback={feedback('scheduledEnd')}
          onInputChange={(e) => setField('scheduledEnd', inputValue(e))}
        />
      </div>
      <ModusWcNumberInput
        label="Price (USD)"
        name="price"
        inputId="job-price"
        currencySymbol="$"
        min={0}
        step={0.01}
        value={values.price}
        feedback={feedback('price')}
        onInputChange={(e) => setField('price', inputValue(e))}
      />
      <AddressFields
        legend="Site address"
        name="siteAddress"
        idPrefix="job-site"
        values={values}
        feedback={feedback}
        onChange={setField}
      />
      <ModusWcTextarea
        label="Description"
        name="description"
        inputId="job-description"
        rows={4}
        value={values.description}
        feedback={feedback('description')}
        onInputChange={(e) => setField('description', inputValue(e))}
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
