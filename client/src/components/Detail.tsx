import type { ReactNode } from 'react';
import type { Address } from '@jarvis/shared';
import { addressLines } from '../format';

/** One labelled value on a detail page. Shows "Not set" when there is no value. Use inside `<dl className="details">`. */
export function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="detail">
      <dt>{label}</dt>
      <dd>{children ?? <span className="muted">Not set</span>}</dd>
    </div>
  );
}

/** An address on several lines, or undefined when nothing is filled in (so `Detail` shows "Not set"). */
export function addressBlock(address: Address | undefined): ReactNode {
  const lines = addressLines(address);
  if (lines.length === 0) return undefined;
  return (
    <address>
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </address>
  );
}
