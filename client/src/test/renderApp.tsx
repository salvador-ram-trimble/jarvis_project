import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import type { Customer } from '@jarvis/shared';
import { App } from '../App';

/** Shows the router location and offers the browser's back and forward buttons, which tests can't press otherwise. */
function LocationProbe() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output aria-label="Current location">{pathname + search}</output>
      <button type="button" onClick={() => navigate(-1)}>
        Browser back
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Browser forward
      </button>
    </>
  );
}

/** Renders the whole app (routes and shell) starting at `path`. */
export function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  );
}

/** The router location, as `pathname + search`. */
export function currentLocation(): string {
  return screen.getByRole('status', { name: 'Current location' }).textContent ?? '';
}

export function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'c1',
    name: 'Acme Plumbing',
    createdAt: '2026-10-08T12:00:00.000Z',
    updatedAt: '2026-10-08T12:00:00.000Z',
    ...overrides,
  };
}

export const fullCustomer = makeCustomer({
  id: 'c42',
  name: 'Ada Lovelace',
  company: 'Analytical Engines Ltd',
  email: 'ada@example.com',
  phone: '+1 555 0100',
  address: { street: '1 Main St', city: 'Springfield', state: 'IL', postalCode: '62701', country: 'USA' },
  notes: 'Prefers email.\nCall after 2pm.',
});
