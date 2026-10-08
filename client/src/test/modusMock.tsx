/**
 * Light stand-ins for the Modus React components. Modus web components don't render in jsdom,
 * so tests swap them for plain elements with the same props and events. That way tests can find
 * them by accessible role and label.
 */
import { useId, type ReactNode } from 'react';

type Children = { children?: ReactNode };

export function ModusWcTextInput(props: {
  label?: string;
  value?: string;
  required?: boolean;
  feedback?: { level: string; message?: string };
  onInputChange?: (e: CustomEvent<{ target: HTMLInputElement }>) => void;
}) {
  const id = useId();
  const feedbackId = `${id}-feedback`;
  return (
    <div>
      <label htmlFor={id}>{props.label}</label>
      <input
        id={id}
        value={props.value ?? ''}
        required={props.required}
        aria-invalid={props.feedback?.level === 'error' || undefined}
        aria-describedby={props.feedback ? feedbackId : undefined}
        onChange={(e) =>
          props.onInputChange?.(new CustomEvent('inputChange', { detail: { target: e.target } }))
        }
      />
      {props.feedback?.message && <div id={feedbackId}>{props.feedback.message}</div>}
    </div>
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

export function ModusWcLoader(props: { 'aria-label'?: string }) {
  return <div role="status" aria-label={props['aria-label']} />;
}

export function ModusWcTable(props: {
  caption?: string;
  columns: { id: string; header: string; accessor: string }[];
  data: Record<string, unknown>[];
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
          <tr key={String(row.id ?? index)}>
            {props.columns.map((column) => (
              <td key={column.id}>{String(row[column.accessor] ?? '')}</td>
            ))}
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
