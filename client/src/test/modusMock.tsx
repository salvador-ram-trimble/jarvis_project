/**
 * Light stand-ins for the Modus React components. Modus web components don't render in jsdom,
 * so tests swap them for plain elements with the same props and events. That way tests can find
 * them by accessible role and label.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react';

type Children = { children?: ReactNode };

type Feedback = { level: string; message?: string };

/** Wires up the label and feedback the way Modus does, so tests can use getByLabelText and toHaveAccessibleDescription. */
function useFieldIds(feedback?: Feedback) {
  const id = useId();
  const feedbackId = `${id}-feedback`;
  return {
    id,
    feedbackId,
    fieldProps: {
      id,
      'aria-invalid': feedback?.level === 'error' || undefined,
      'aria-describedby': feedback ? feedbackId : undefined,
    },
  };
}

function FeedbackMessage({ id, feedback }: { id: string; feedback?: Feedback }) {
  return feedback?.message ? <div id={id}>{feedback.message}</div> : null;
}

export function ModusWcTextInput(props: {
  label?: string;
  type?: string;
  value?: string;
  required?: boolean;
  feedback?: Feedback;
  onInputChange?: (e: CustomEvent<{ target: HTMLInputElement }>) => void;
}) {
  const { id, feedbackId, fieldProps } = useFieldIds(props.feedback);
  return (
    <div>
      <label htmlFor={id}>{props.label}</label>
      <input
        {...fieldProps}
        type={props.type ?? 'text'}
        value={props.value ?? ''}
        required={props.required}
        onChange={(e) =>
          props.onInputChange?.(new CustomEvent('inputChange', { detail: { target: e.target } }))
        }
      />
      <FeedbackMessage id={feedbackId} feedback={props.feedback} />
    </div>
  );
}

export function ModusWcTextarea(props: {
  label?: string;
  value?: string;
  rows?: number;
  feedback?: Feedback;
  onInputChange?: (e: CustomEvent<{ target: HTMLTextAreaElement }>) => void;
}) {
  const { id, feedbackId, fieldProps } = useFieldIds(props.feedback);
  return (
    <div>
      <label htmlFor={id}>{props.label}</label>
      <textarea
        {...fieldProps}
        rows={props.rows}
        value={props.value ?? ''}
        onChange={(e) =>
          props.onInputChange?.(new CustomEvent('inputChange', { detail: { target: e.target } }))
        }
      />
      <FeedbackMessage id={feedbackId} feedback={props.feedback} />
    </div>
  );
}

export function ModusWcSelect(props: {
  label?: string;
  value?: string;
  required?: boolean;
  feedback?: Feedback;
  options?: { value: string; label: string }[];
  onInputChange?: (e: CustomEvent<{ target: HTMLSelectElement }>) => void;
}) {
  const { id, feedbackId, fieldProps } = useFieldIds(props.feedback);
  return (
    <div>
      <label htmlFor={id}>{props.label}</label>
      <select
        {...fieldProps}
        value={props.value ?? ''}
        required={props.required}
        onChange={(e) =>
          props.onInputChange?.(new CustomEvent('inputChange', { detail: { target: e.target } }))
        }
      >
        {props.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FeedbackMessage id={feedbackId} feedback={props.feedback} />
    </div>
  );
}

/** Modus shows a calendar picker, and its inputChange always reports the date as YYYY-MM-DD (or ''). A text input stands in. */
export function ModusWcDate(props: {
  label?: string;
  value?: string;
  feedback?: Feedback;
  onInputChange?: (e: CustomEvent<{ target: HTMLInputElement }>) => void;
}) {
  const { id, feedbackId, fieldProps } = useFieldIds(props.feedback);
  return (
    <div>
      <label htmlFor={id}>{props.label}</label>
      <input
        {...fieldProps}
        type="text"
        placeholder="YYYY-MM-DD"
        value={props.value ?? ''}
        onChange={(e) =>
          props.onInputChange?.(new CustomEvent('inputChange', { detail: { target: e.target } }))
        }
      />
      <FeedbackMessage id={feedbackId} feedback={props.feedback} />
    </div>
  );
}

export function ModusWcNumberInput(props: {
  label?: string;
  value?: string;
  min?: number;
  step?: number;
  feedback?: Feedback;
  onInputChange?: (e: CustomEvent<{ target: HTMLInputElement }>) => void;
}) {
  const { id, feedbackId, fieldProps } = useFieldIds(props.feedback);
  return (
    <div>
      <label htmlFor={id}>{props.label}</label>
      <input
        {...fieldProps}
        type="number"
        min={props.min}
        step={props.step}
        value={props.value ?? ''}
        onChange={(e) =>
          props.onInputChange?.(new CustomEvent('inputChange', { detail: { target: e.target } }))
        }
      />
      <FeedbackMessage id={feedbackId} feedback={props.feedback} />
    </div>
  );
}

export function ModusWcEmptyState(props: {
  heading: string;
  subtitle?: string;
  actionLabel?: string;
  onActionClick?: () => void;
}) {
  // Modus renders the heading as an h2.
  return (
    <section>
      <h2>{props.heading}</h2>
      {props.subtitle && <p>{props.subtitle}</p>}
      {props.actionLabel && (
        <button type="button" onClick={() => props.onActionClick?.()}>
          {props.actionLabel}
        </button>
      )}
    </section>
  );
}

export function ModusWcButton(
  props: Children & { type?: 'button' | 'submit' | 'reset'; disabled?: boolean; onButtonClick?: () => void },
) {
  return (
    <button type={props.type ?? 'button'} disabled={props.disabled} onClick={() => props.onButtonClick?.()}>
      {props.children}
    </button>
  );
}

export function ModusWcAlert(props: { alertTitle: string; alertDescription?: string }) {
  return (
    <div role="alert">
      <strong>{props.alertTitle}</strong> {props.alertDescription}
    </div>
  );
}

export function ModusWcBadge({ children }: Children) {
  return <span>{children}</span>;
}

export function ModusWcLoader(props: { 'aria-label'?: string }) {
  return <div role="status" aria-label={props['aria-label']} />;
}

type TableRow = Record<string, unknown>;

/** Renders a column's cellRenderer result, which Modus allows to be a string or a DOM element. */
function RenderedCell({ content }: { content: string | HTMLElement }) {
  const ref = useRef<HTMLTableCellElement>(null);
  useEffect(() => {
    const cell = ref.current;
    if (!cell || typeof content === 'string') return;
    cell.replaceChildren(content);
    return () => cell.replaceChildren();
  }, [content]);
  return <td ref={ref}>{typeof content === 'string' ? content : null}</td>;
}

export function ModusWcTable(props: {
  caption?: string;
  columns: {
    id: string;
    header: string;
    accessor: string;
    cellRenderer?: (value: unknown, row: TableRow) => string | HTMLElement;
  }[];
  data: TableRow[];
  onRowClick?: (e: CustomEvent<{ row: TableRow; index: number }>) => void;
}) {
  return (
    <table>
      {props.caption && <caption>{props.caption}</caption>}
      <thead>
        <tr>
          {props.columns.map((column) => (
            <th key={column.id}>{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.data.map((row, index) => (
          <tr
            key={String(row.id ?? index)}
            onClick={() => props.onRowClick?.(new CustomEvent('rowClick', { detail: { row, index } }))}
          >
            {props.columns.map((column) =>
              column.cellRenderer ? (
                <RenderedCell key={column.id} content={column.cellRenderer(row[column.accessor], row)} />
              ) : (
                <td key={column.id}>{String(row[column.accessor] ?? '')}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ModusWcNavbar() {
  return <header />;
}

export function ModusWcSideNavigation({ children }: Children) {
  return <nav>{children}</nav>;
}

export function ModusWcMenu({ children }: Children) {
  return <ul>{children}</ul>;
}

export function ModusWcMenuItem(props: Children & { label: string; onItemSelect?: () => void }) {
  return (
    <li>
      <button type="button" onClick={() => props.onItemSelect?.()}>
        {props.label}
      </button>
    </li>
  );
}

export function ModusWcIcon() {
  return null;
}
