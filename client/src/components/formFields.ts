import type { FieldErrors } from '@jarvis/shared';

/** The value from a Modus input's `inputChange` event. */
export function inputValue(event: CustomEvent<InputEvent>): string {
  return (event.detail.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
}

export type FieldFeedback = { level: 'error'; message: string } | undefined;

/** Returns a function giving the Modus `feedback` prop for a field: its error, if it has one. */
export function feedbackFor(fieldErrors: FieldErrors) {
  return (errorKey: string): FieldFeedback => {
    const message = fieldErrors[errorKey];
    return message ? { level: 'error', message } : undefined;
  };
}
