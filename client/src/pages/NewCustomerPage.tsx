import { useNavigate } from 'react-router';
import type { CustomerInput } from '@jarvis/shared';
import { CustomerForm } from '../components/CustomerForm';
import { useCreateCustomer } from '../hooks/useCustomers';

export function NewCustomerPage() {
  const { create, submitting, error } = useCreateCustomer();
  const navigate = useNavigate();

  async function handleSubmit(input: CustomerInput) {
    const customer = await create(input);
    if (customer) {
      navigate('/customers');
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
        onCancel={() => navigate('/customers')}
      />
    </>
  );
}
