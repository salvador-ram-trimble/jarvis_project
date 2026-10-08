import { useNavigate } from 'react-router';
import type { CustomerInput } from '@jarvis/shared';
import { CustomerForm } from '../components/CustomerForm';
import { useCreateCustomer } from '../hooks/useCustomers';
import { useGoBack } from '../hooks/useGoBack';

export function NewCustomerPage() {
  const { create, submitting, error } = useCreateCustomer();
  const navigate = useNavigate();
  const goBack = useGoBack();

  async function handleSubmit(input: CustomerInput) {
    const customer = await create(input);
    if (customer) {
      // Replace the form in the history, so Back from the new customer's page returns to where the user came from.
      navigate(`/customers/${customer.id}`, { replace: true });
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>New customer</h1>
      </div>
      <CustomerForm
        submitLabel="Create customer"
        submitting={submitting}
        serverError={error}
        onSubmit={handleSubmit}
        onCancel={() => goBack('/customers')}
      />
    </>
  );
}
