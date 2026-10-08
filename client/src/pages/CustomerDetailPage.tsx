import { ModusWcAlert, ModusWcButton, ModusWcLoader } from '@trimble-oss/moduswebcomponents-react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { Customer } from '@jarvis/shared';
import { addressLines, formatDateTime } from '../format';
import { useCustomer } from '../hooks/useCustomers';
import { NotFoundPage } from './NotFoundPage';

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="detail">
      <dt>{label}</dt>
      <dd>{children ?? <span className="muted">Not set</span>}</dd>
    </div>
  );
}

function CustomerDetails({ customer }: { customer: Customer }) {
  const address = addressLines(customer.address);
  return (
    <dl className="details">
      <Detail label="Company">{customer.company}</Detail>
      <Detail label="Email">{customer.email && <a href={`mailto:${customer.email}`}>{customer.email}</a>}</Detail>
      <Detail label="Phone">{customer.phone && <a href={`tel:${customer.phone}`}>{customer.phone}</a>}</Detail>
      <Detail label="Address">
        {address.length > 0 ? (
          <address>
            {address.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </address>
        ) : undefined}
      </Detail>
      <Detail label="Notes">{customer.notes && <p className="notes">{customer.notes}</p>}</Detail>
      <Detail label="Created">{formatDateTime(customer.createdAt)}</Detail>
      <Detail label="Last updated">{formatDateTime(customer.updatedAt)}</Detail>
    </dl>
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
        </>
      )}
    </>
  );
}
