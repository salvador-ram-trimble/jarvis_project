import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../api/client';
import { formatCalendarDate } from '../format';
import { currentLocation, fullJob, makeJob, renderApp } from '../test/renderApp';

const jobs = [
  makeJob({ id: 'b', title: 'bravo', status: 'in_progress', scheduledStart: '2026-10-20', createdAt: '2026-10-02T00:00:00.000Z' }),
  makeJob({ id: 'n', title: 'No date', status: 'scheduled', createdAt: '2026-10-04T00:00:00.000Z' }),
  makeJob({ id: 'c', title: 'Charlie', status: 'done', scheduledStart: '2026-10-05', createdAt: '2026-10-03T00:00:00.000Z' }),
  makeJob({ id: 'a', title: 'Alpha', status: 'in_progress', scheduledStart: '2026-10-10', createdAt: '2026-10-01T00:00:00.000Z' }),
];

/** The titles in the table, top to bottom. */
function shownTitles(): string[] {
  const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
  return rows.map((row) => within(row).getAllByRole('cell')[0].textContent ?? '');
}

describe('Jobs list page', () => {
  it('shows a loading indicator, then each job with its customer, status, start and price', async () => {
    vi.mocked(api.jobs.list).mockResolvedValue([fullJob]);
    renderApp('/jobs');

    expect(screen.getByRole('status', { name: 'Loading jobs' })).toBeInTheDocument();
    const row = (await screen.findByRole('cell', { name: 'Kitchen remodel' })).closest('tr')!;
    expect(api.jobs.list).toHaveBeenCalledWith();
    expect(within(row).getByRole('cell', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: 'In progress' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: formatCalendarDate('2026-10-12') })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '$1,250.00' })).toBeInTheDocument();
  });

  it('filters by status, keeps the filter in the URL, and clears it', async () => {
    const user = userEvent.setup();
    vi.mocked(api.jobs.list).mockResolvedValue(jobs);
    renderApp('/jobs');

    await screen.findByRole('table');
    expect(shownTitles()).toHaveLength(4);
    expect(screen.queryByRole('button', { name: 'Clear filter' })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Status'), 'In progress');
    expect(currentLocation()).toBe('/jobs?status=in_progress');
    expect(shownTitles()).toEqual(['Alpha', 'bravo']);

    await user.selectOptions(screen.getByLabelText('Status'), 'Done');
    expect(currentLocation()).toBe('/jobs?status=done');
    expect(shownTitles()).toEqual(['Charlie']);

    await user.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(currentLocation()).toBe('/jobs');
    expect(screen.getByLabelText('Status')).toHaveValue('');
    expect(shownTitles()).toHaveLength(4);
  });

  it('applies the status filter from the URL', async () => {
    vi.mocked(api.jobs.list).mockResolvedValue(jobs);
    renderApp('/jobs?status=in_progress');

    await screen.findByRole('table');
    expect(screen.getByLabelText('Status')).toHaveValue('in_progress');
    expect(shownTitles()).toEqual(['Alpha', 'bravo']);
  });

  it('ignores an unknown status in the URL', async () => {
    vi.mocked(api.jobs.list).mockResolvedValue(jobs);
    renderApp('/jobs?status=paused');

    await screen.findByRole('table');
    expect(screen.getByLabelText('Status')).toHaveValue('');
    expect(shownTitles()).toHaveLength(4);
  });

  it('shows a message with a clear action when no job has the chosen status', async () => {
    const user = userEvent.setup();
    vi.mocked(api.jobs.list).mockResolvedValue(jobs);
    renderApp('/jobs?status=cancelled');

    const emptyState = (await screen.findByRole('heading', { name: 'No matching jobs' })).closest('section')!;
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.click(within(emptyState).getByRole('button', { name: 'Clear filter' }));

    expect(currentLocation()).toBe('/jobs');
    expect(shownTitles()).toHaveLength(4);
  });

  it('sorts by scheduled start by default, with undated jobs last, and by title or created date when chosen', async () => {
    const user = userEvent.setup();
    vi.mocked(api.jobs.list).mockResolvedValue(jobs);
    renderApp('/jobs');

    await screen.findByRole('table');
    expect(shownTitles()).toEqual(['Charlie', 'Alpha', 'bravo', 'No date']);

    await user.selectOptions(screen.getByLabelText('Sort by'), 'Scheduled start (latest first)');
    expect(shownTitles()).toEqual(['bravo', 'Alpha', 'Charlie', 'No date']);
    expect(currentLocation()).toBe('/jobs?sort=start-desc');

    await user.selectOptions(screen.getByLabelText('Sort by'), 'Title (A to Z)');
    expect(shownTitles()).toEqual(['Alpha', 'bravo', 'Charlie', 'No date']);

    await user.selectOptions(screen.getByLabelText('Sort by'), 'Title (Z to A)');
    expect(shownTitles()).toEqual(['No date', 'Charlie', 'bravo', 'Alpha']);

    await user.selectOptions(screen.getByLabelText('Sort by'), 'Newest first');
    expect(shownTitles()).toEqual(['No date', 'Charlie', 'bravo', 'Alpha']);

    await user.selectOptions(screen.getByLabelText('Sort by'), 'Oldest first');
    expect(shownTitles()).toEqual(['Alpha', 'bravo', 'Charlie', 'No date']);
  });

  it('keeps the filter and the sort together in the URL', async () => {
    const user = userEvent.setup();
    vi.mocked(api.jobs.list).mockResolvedValue(jobs);
    renderApp('/jobs?status=in_progress');

    await screen.findByRole('table');
    await user.selectOptions(screen.getByLabelText('Sort by'), 'Title (Z to A)');

    expect(currentLocation()).toBe('/jobs?status=in_progress&sort=title-desc');
    expect(shownTitles()).toEqual(['bravo', 'Alpha']);
  });

  it("opens a job's page from its title", async () => {
    const user = userEvent.setup();
    vi.mocked(api.jobs.list).mockResolvedValue([fullJob]);
    vi.mocked(api.jobs.get).mockResolvedValue(fullJob);
    renderApp('/jobs');

    const link = await screen.findByRole('link', { name: 'Kitchen remodel' });
    expect(link).toHaveAttribute('href', '/jobs/j42');
    await user.click(link);

    expect(await screen.findByRole('heading', { level: 1, name: 'Kitchen remodel' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/jobs/j42');
  });

  it('shows an empty state whose action opens the new job form', async () => {
    const user = userEvent.setup();
    renderApp('/jobs');

    const emptyState = (await screen.findByRole('heading', { name: 'No jobs yet' })).closest('section')!;
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.click(within(emptyState).getByRole('button', { name: 'New job' }));

    expect(await screen.findByRole('heading', { name: 'New job' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/jobs/new');
  });

  it('shows an error message when the server fails', async () => {
    vi.mocked(api.jobs.list).mockRejectedValue(new ApiError(500, 'Something went wrong on the server'));
    renderApp('/jobs');

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on the server');
  });

  it('is reached from the side navigation', async () => {
    const user = userEvent.setup();
    renderApp('/customers');

    await user.click(screen.getByRole('button', { name: 'Jobs' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Jobs' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/jobs');
  });
});
