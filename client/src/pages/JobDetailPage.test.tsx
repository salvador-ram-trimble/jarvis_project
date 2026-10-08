import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../api/client';
import { formatCalendarDate } from '../format';
import { currentLocation, fullCustomer, fullJob, makeJob, renderApp } from '../test/renderApp';

/** The value shown under a detail label. */
function detail(label: string): HTMLElement {
  const term = screen.getByText(label, { selector: 'dt' });
  return term.nextElementSibling as HTMLElement;
}

describe('Job detail page', () => {
  it('shows a loading indicator, then every field', async () => {
    vi.mocked(api.jobs.get).mockResolvedValue(fullJob);
    renderApp('/jobs/j42');

    expect(screen.getByRole('status', { name: 'Loading job' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Kitchen remodel' })).toBeInTheDocument();
    expect(api.jobs.get).toHaveBeenCalledWith('j42');
    expect(within(detail('Customer')).getByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute(
      'href',
      '/customers/c42',
    );
    expect(detail('Status')).toHaveTextContent('In progress');
    expect(detail('Price')).toHaveTextContent('$1,250.00');
    expect(detail('Scheduled start')).toHaveTextContent(formatCalendarDate('2026-10-12'));
    expect(detail('Scheduled end')).toHaveTextContent(formatCalendarDate('2026-10-16'));
    expect(detail('Site address')).toHaveTextContent('9 Site Rd');
    expect(detail('Site address')).toHaveTextContent('Shelbyville, IL 62565');
    expect(detail('Site address')).toHaveTextContent('USA');
    expect(detail('Description')).toHaveTextContent('New cabinets. Keep the old sink.');
    expect(detail('Created')).not.toHaveTextContent('Not set');
    expect(detail('Last updated')).not.toHaveTextContent('Not set');
  });

  it('shows every status with its label', async () => {
    const labels = { scheduled: 'Scheduled', in_progress: 'In progress', done: 'Done', cancelled: 'Cancelled' } as const;
    for (const [status, label] of Object.entries(labels)) {
      vi.mocked(api.jobs.get).mockResolvedValue(makeJob({ status: status as keyof typeof labels }));
      const { unmount } = renderApp('/jobs/j1');

      await screen.findByRole('heading', { level: 1, name: 'Fix the sink' });
      expect(detail('Status')).toHaveTextContent(label);
      unmount();
    }
  });

  it('marks optional fields that are not set', async () => {
    vi.mocked(api.jobs.get).mockResolvedValue(makeJob());
    renderApp('/jobs/j1');

    await screen.findByRole('heading', { level: 1, name: 'Fix the sink' });
    for (const label of ['Price', 'Scheduled start', 'Scheduled end', 'Site address', 'Description']) {
      expect(detail(label)).toHaveTextContent('Not set');
    }
  });

  it('shows a price of zero rather than "Not set"', async () => {
    vi.mocked(api.jobs.get).mockResolvedValue(makeJob({ price: 0 }));
    renderApp('/jobs/j1');

    await screen.findByRole('heading', { level: 1, name: 'Fix the sink' });
    expect(detail('Price')).toHaveTextContent('$0.00');
  });

  it("goes to the customer's page", async () => {
    const user = userEvent.setup();
    vi.mocked(api.jobs.get).mockResolvedValue(fullJob);
    vi.mocked(api.customers.get).mockResolvedValue(fullCustomer);
    renderApp('/jobs/j42');

    await user.click(await screen.findByRole('link', { name: 'Ada Lovelace' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/customers/c42');
  });

  it('opens the edit page', async () => {
    const user = userEvent.setup();
    vi.mocked(api.jobs.get).mockResolvedValue(fullJob);
    vi.mocked(api.customers.list).mockResolvedValue([fullCustomer]);
    renderApp('/jobs/j42');

    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    expect(await screen.findByRole('heading', { name: 'Edit job' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/jobs/j42/edit');
  });

  it('shows the not-found page for an unknown or malformed id', async () => {
    vi.mocked(api.jobs.get).mockRejectedValue(new ApiError(404, 'Not found'));
    renderApp('/jobs/not-an-id');

    expect(await screen.findByRole('heading', { name: 'Job not found' })).toBeInTheDocument();
  });

  it('shows an error message when the server fails', async () => {
    vi.mocked(api.jobs.get).mockRejectedValue(new ApiError(500, 'Something went wrong on the server'));
    renderApp('/jobs/j42');

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on the server');
  });
});
