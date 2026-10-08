import { ModusWcAlert, ModusWcLoader } from '@trimble-oss/moduswebcomponents-react';
import { useParams } from 'react-router';
import type { CustomerInput } from '@jarvis/shared';
import { CustomerForm } from '../components/CustomerForm';
import { useCustomer, useUpdateCustomer } from '../hooks/useCustomers';
import { useGoBack } from '../hooks/useGoBack';
import { NotFoundPage } from './NotFoundPage';

export function EditCustomerPage() {
  const { id = '' } = useParams();
  const { customer, loading, notFound, error: loadError } = useCustomer(id);
  const { update, submitting, error: saveError } = useUpdateCustomer();
  const goBack = useGoBack();
  const detailPath = `/customers/${id}`;

  async function handleSubmit(input: CustomerInput) {
    if (await update(id, input)) {
      // Back to the detail page, which reloads the customer.
      goBack(detailPath);
    }
  }

  if (notFound) {
    return <NotFoundPage title="Customer not found" message="This customer doesn't exist." />;
  }

  return (
    <>
      <div className="page-header">
        <h1>Edit customer</h1>
      </div>
      {loading ? (
        <ModusWcLoader aria-label="Loading customer" />
      ) : loadError || !customer ? (
        <ModusWcAlert
          variant="error"
          alertTitle="Could not load the customer"
          alertDescription={loadError?.message}
        />
      ) : (
        <CustomerForm
          initialCustomer={customer}
          submitLabel="Save changes"
          submitting={submitting}
          serverError={saveError}
          onSubmit={handleSubmit}
          onCancel={() => goBack(detailPath)}
        />
      )}
    </>
  );
}
