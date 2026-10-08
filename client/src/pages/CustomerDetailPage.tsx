import {
  ModusWcAlert,
  ModusWcButton,
  ModusWcEmptyState,
  ModusWcLoader,
  ModusWcTable,
} from '@trimble-oss/moduswebcomponents-react';
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { JOB_STATUS_LABELS, type Customer } from '@jarvis/shared';
import { addressBlock, Detail } from '../components/Detail';
import { tableLink } from '../components/tableLink';
import { formatCalendarDate, formatDateTime, formatPrice } from '../format';
import { useCustomer } from '../hooks/useCustomers';
import { useCustomerJobs } from '../hooks/useJobs';
import { NotFoundPage } from './NotFoundPage';

function CustomerDetails({ customer }: { customer: Customer }) {
  return (
    <dl className="details">
      <Detail label="Company">{customer.company}</Detail>
      <Detail label="Email">{customer.email && <a href={`mailto:${customer.email}`}>{customer.email}</a>}</Detail>
      <Detail label="Phone">{customer.phone && <a href={`tel:${customer.phone}`}>{customer.phone}</a>}</Detail>
      <Detail label="Address">{addressBlock(customer.address)}</Detail>
      <Detail label="Notes">{customer.notes && <p className="notes">{customer.notes}</p>}</Detail>
      <Detail label="Created">{formatDateTime(customer.createdAt)}</Detail>
      <Detail label="Last updated">{formatDateTime(customer.updatedAt)}</Detail>
    </dl>
  );
}

/** The customer's jobs, newest first, with a "New job" action that starts with this customer selected. */
function CustomerJobs({ customerId }: { customerId: string }) {
  const { jobs, loading, error } = useCustomerJobs(customerId);
  const navigate = useNavigate();

  const columns = useMemo(
    () => [
      {
        id: 'title',
        header: 'Title',
        accessor: 'title',
        cellRenderer: (value: unknown, row: unknown) =>
          tableLink(navigate, `/jobs/${(row as { id: string }).id}`, String(value)),
      },
      { id: 'status', header: 'Status', accessor: 'status' },
      { id: 'start', header: 'Scheduled start', accessor: 'start' },
      { id: 'price', header: 'Price', accessor: 'price' },
    ],
    [navigate],
  );

  const rows = useMemo(
    () =>
      jobs.map((job) => ({
        id: job.id,
        title: job.title,
        status: JOB_STATUS_LABELS[job.status],
        start: job.scheduledStart ? formatCalendarDate(job.scheduledStart) : '',
        price: job.price === undefined ? '' : formatPrice(job.price),
      })),
    [jobs],
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
          subtitle="Jobs for this customer will show up here."
        />
      );
    }
    return (
      <ModusWcTable
        caption="Jobs for this customer"
        columns={columns}
        data={rows}
        sortable={false}
        hover
        onRowClick={(e) => navigate(`/jobs/${String(e.detail.row.id)}`)}
      />
    );
  }

  return (
    <section className="section" aria-labelledby="customer-jobs-heading">
      <div className="section-header">
        <h2 id="customer-jobs-heading">Jobs</h2>
        <ModusWcButton
          variant="outlined"
          onButtonClick={() => navigate(`/jobs/new?customerId=${encodeURIComponent(customerId)}`)}
        >
          New job
        </ModusWcButton>
      </div>
      {renderContent()}
    </section>
  );
}

export function CustomerDetailPage() {
  const { id = '' } = useParams();
  const { customer, loading, notFound, error } = useCustomer(id);
  const navigate = useNavigate();

  if (notFound) {
    return <NotFoundPage title="Customer not found" message="This customer doesn't exist." />;
  }

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/customers">Customers</Link>
      </nav>
      {loading ? (
        <ModusWcLoader aria-label="Loading customer" />
      ) : error || !customer ? (
        <ModusWcAlert variant="error" alertTitle="Could not load the customer" alertDescription={error?.message} />
      ) : (
        <>
          <div className="page-header">
            <h1>{customer.name}</h1>
            <ModusWcButton onButtonClick={() => navigate(`/customers/${customer.id}/edit`)}>Edit</ModusWcButton>
          </div>
          <CustomerDetails customer={customer} />
          <CustomerJobs customerId={customer.id} />
        </>
      )}
    </>
  );
}
