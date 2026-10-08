import { ModusWcAlert, ModusWcButton, ModusWcLoader, ModusWcTable } from '@trimble-oss/moduswebcomponents-react';
import { useNavigate } from 'react-router';
import { useCustomers } from '../hooks/useCustomers';

const COLUMNS = [
  { id: 'name', header: 'Name', accessor: 'name' },
  { id: 'company', header: 'Company', accessor: 'company' },
  { id: 'email', header: 'Email', accessor: 'email' },
  { id: 'phone', header: 'Phone', accessor: 'phone' },
];

export function CustomersListPage() {
  const { customers, loading, error } = useCustomers();
  const navigate = useNavigate();

  // Company, email and phone are added to customers in phase 2; until then those columns are empty.
  const rows = customers.map((customer) => ({ id: customer.id, name: customer.name, company: '', email: '', phone: '' }));

  return (
    <>
      <div className="page-header">
        <h1>Customers</h1>
        <ModusWcButton onButtonClick={() => navigate('/customers/new')}>New customer</ModusWcButton>
      </div>
      {loading ? (
        <ModusWcLoader aria-label="Loading customers" />
      ) : error ? (
        <ModusWcAlert variant="error" alertTitle="Could not load customers" alertDescription={error.message} />
      ) : (
        <ModusWcTable caption="Customers" columns={COLUMNS} data={rows} sortable={false} hover />
      )}
    </>
  );
}
