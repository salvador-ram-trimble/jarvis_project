import {
  ModusWcAlert,
  ModusWcButton,
  ModusWcEmptyState,
  ModusWcLoader,
  ModusWcSelect,
  ModusWcTable,
} from '@trimble-oss/moduswebcomponents-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { JOB_STATUSES, JOB_STATUS_LABELS, isJobStatus, type Job } from '@jarvis/shared';
import { tableLink } from '../components/tableLink';
import { formatCalendarDate, formatPrice } from '../format';
import { useJobs } from '../hooks/useJobs';
import { useSearchParam } from '../hooks/useSearchParam';

/** Jobs without a scheduled start always sort last, whichever the direction. */
function compareStart(a: Job, b: Job, direction: 1 | -1): number {
  if (!a.scheduledStart || !b.scheduledStart) {
    return Number(!a.scheduledStart) - Number(!b.scheduledStart);
  }
  return direction * a.scheduledStart.localeCompare(b.scheduledStart);
}

function compareTitles(a: Job, b: Job): number {
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true });
}

const SORT_OPTIONS = [
  { value: 'start-asc', label: 'Scheduled start (soonest first)', compare: (a: Job, b: Job) => compareStart(a, b, 1) },
  { value: 'start-desc', label: 'Scheduled start (latest first)', compare: (a: Job, b: Job) => compareStart(a, b, -1) },
  { value: 'title-asc', label: 'Title (A to Z)', compare: (a: Job, b: Job) => compareTitles(a, b) },
  { value: 'title-desc', label: 'Title (Z to A)', compare: (a: Job, b: Job) => compareTitles(b, a) },
  { value: 'created-desc', label: 'Newest first', compare: (a: Job, b: Job) => b.createdAt.localeCompare(a.createdAt) },
  { value: 'created-asc', label: 'Oldest first', compare: (a: Job, b: Job) => a.createdAt.localeCompare(b.createdAt) },
];
const DEFAULT_SORT = SORT_OPTIONS[0];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...JOB_STATUSES.map((status) => ({ value: status, label: JOB_STATUS_LABELS[status] })),
];

export function JobsListPage() {
  const { jobs, loading, error } = useJobs();
  const navigate = useNavigate();
  // The filter and sort live in the URL, so a filtered list can be shared and survives going to a job and back.
  const [statusParam, setStatus] = useSearchParam('status');
  const [sortParam, setSort] = useSearchParam('sort', DEFAULT_SORT.value);
  const status = isJobStatus(statusParam) ? statusParam : undefined;
  const sort = SORT_OPTIONS.find((option) => option.value === sortParam) ?? DEFAULT_SORT;

  const columns = useMemo(
    () => [
      {
        id: 'title',
        header: 'Title',
        accessor: 'title',
        cellRenderer: (value: unknown, row: unknown) =>
          tableLink(navigate, `/jobs/${(row as { id: string }).id}`, String(value)),
      },
      { id: 'customer', header: 'Customer', accessor: 'customer' },
      { id: 'status', header: 'Status', accessor: 'status' },
      { id: 'start', header: 'Scheduled start', accessor: 'start' },
      { id: 'price', header: 'Price', accessor: 'price' },
    ],
    [navigate],
  );

  const shownJobs = useMemo(
    () => jobs.filter((job) => !status || job.status === status).sort(sort.compare),
    [jobs, status, sort],
  );

  const rows = useMemo(
    () =>
      shownJobs.map((job) => ({
        id: job.id,
        title: job.title,
        customer: job.customer.name,
        status: JOB_STATUS_LABELS[job.status],
        start: job.scheduledStart ? formatCalendarDate(job.scheduledStart) : '',
        price: job.price === undefined ? '' : formatPrice(job.price),
      })),
    [shownJobs],
  );

  function renderContent() {
    if (loading) {
      return <ModusWcLoader aria-label="Loading jobs" />;
    }
    if (error) {
      return <ModusWcAlert variant="error" alertTitle="Could not load jobs" alertDescription={error.message} />;
    }
    if (jobs.length === 0) {
      return (
        <ModusWcEmptyState
          variant="compact"
          illustration="selection_plus"
          heading="No jobs yet"
          subtitle="Create a job to start tracking work for your customers."
          actionLabel="New job"
          onActionClick={() => navigate('/jobs/new')}
        />
      );
    }
    return (
      <>
        <div className="list-toolbar">
          <ModusWcSelect
            label="Status"
            inputId="jobs-status"
            size="sm"
            options={STATUS_FILTER_OPTIONS}
            value={status ?? ''}
            onInputChange={(e) => setStatus((e.detail.target as HTMLSelectElement).value)}
          />
          <ModusWcSelect
            label="Sort by"
            inputId="jobs-sort"
            size="sm"
            options={SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
            value={sort.value}
            onInputChange={(e) => setSort((e.detail.target as HTMLSelectElement).value)}
          />
          {status && (
            <ModusWcButton size="sm" variant="borderless" onButtonClick={() => setStatus('')}>
              Clear filter
            </ModusWcButton>
          )}
        </div>
        {shownJobs.length === 0 ? (
          <ModusWcEmptyState
            variant="compact"
            illustration="symbol_info"
            heading="No matching jobs"
            subtitle={`No jobs are ${JOB_STATUS_LABELS[status!].toLowerCase()}.`}
            actionLabel="Clear filter"
            onActionClick={() => setStatus('')}
          />
        ) : (
          <ModusWcTable
            caption="Jobs"
            columns={columns}
            data={rows}
            sortable={false}
            hover
            onRowClick={(e) => navigate(`/jobs/${String(e.detail.row.id)}`)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Jobs</h1>
        <ModusWcButton onButtonClick={() => navigate('/jobs/new')}>New job</ModusWcButton>
      </div>
      {renderContent()}
    </>
  );
}
