import {
  ModusWcAlert,
  ModusWcButton,
  ModusWcEmptyState,
  ModusWcLoader,
  ModusWcSelect,
  ModusWcTable,
} from '@trimble-oss/moduswebcomponents-react';
import { useMemo } from 'react';
import { useNavigate, useSearchParams, type NavigateFunction } from 'react-router';
import type { Customer } from '@jarvis/shared';
import { formatDate } from '../format';
import { useCustomers } from '../hooks/useCustomers';

const SORT_OPTIONS = [
  { value: 'created-desc', label: 'Newest first', compare: (a: Customer, b: Customer) => b.createdAt.localeCompare(a.createdAt) },
  { value: 'created-asc', label: 'Oldest first', compare: (a: Customer, b: Customer) => a.createdAt.localeCompare(b.createdAt) },
  { value: 'name-asc', label: 'Name (A to Z)', compare: (a: Customer, b: Customer) => compareNames(a, b) },
  { value: 'name-desc', label: 'Name (Z to A)', compare: (a: Customer, b: Customer) => compareNames(b, a) },
];
const DEFAULT_SORT = SORT_OPTIONS[0];

function compareNames(a: Customer, b: Customer): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
}

/**
 * The name cell is a real link, so it can be opened in a new tab. A plain click is handled by the router
 * instead of reloading the page.
 */
function customerLink(navigate: NavigateFunction, id: string, name: string): HTMLElement {
  const link = document.createElement('a');
  const path = `/customers/${id}`;
  link.href = path;
  link.textContent = name;
  link.addEventListener('click', (event) => {
    // The row's own click handler would navigate too.
    event.stopPropagation();
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(path);
  });
  return link;
}

export function CustomersListPage() {
  const { customers, loading, error } = useCustomers();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // The sort lives in the URL, so it survives going to a customer and coming back.
  const sort = SORT_OPTIONS.find((option) => option.value === searchParams.get('sort')) ?? DEFAULT_SORT;

  function setSort(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value === DEFAULT_SORT.value) {
      next.delete('sort');
    } else {
      next.set('sort', value);
    }
    setSearchParams(next, { replace: true });
  }

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessor: 'name',
        cellRenderer: (value: unknown, row: unknown) =>
          customerLink(navigate, (row as { id: string }).id, String(value)),
      },
      { id: 'company', header: 'Company', accessor: 'company' },
      { id: 'email', header: 'Email', accessor: 'email' },
      { id: 'phone', header: 'Phone', accessor: 'phone' },
      { id: 'created', header: 'Created', accessor: 'created' },
    ],
    [navigate],
  );

  const rows = useMemo(
    () =>
      [...customers].sort(sort.compare).map((customer) => ({
        id: customer.id,
        name: customer.name,
        company: customer.company ?? '',
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        created: formatDate(customer.createdAt),
      })),
    [customers, sort],
  );

  function renderContent() {
    if (loading) {
      return <ModusWcLoader aria-label="Loading customers" />;
    }
    if (error) {
      return <ModusWcAlert variant="error" alertTitle="Could not load customers" alertDescription={error.message} />;
    }
    if (customers.length === 0) {
      return (
        <ModusWcEmptyState
          variant="compact"
          illustration="add_user"
          heading="No customers yet"
          subtitle="Add your first customer to start tracking their details and jobs."
          actionLabel="New customer"
          onActionClick={() => navigate('/customers/new')}
        />
      );
    }
    return (
      <>
        <div className="list-toolbar">
          <ModusWcSelect
            label="Sort by"
            inputId="customers-sort"
            size="sm"
            options={SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
            value={sort.value}
            onInputChange={(e) => setSort((e.detail.target as HTMLSelectElement).value)}
          />
        </div>
        <ModusWcTable
          caption="Customers"
          columns={columns}
          data={rows}
          sortable={false}
          hover
          onRowClick={(e) => navigate(`/customers/${String(e.detail.row.id)}`)}
        />
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Customers</h1>
        <ModusWcButton onButtonClick={() => navigate('/customers/new')}>New customer</ModusWcButton>
      </div>
      {renderContent()}
    </>
  );
}
