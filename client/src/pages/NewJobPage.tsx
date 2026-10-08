import { ModusWcAlert, ModusWcEmptyState, ModusWcLoader } from '@trimble-oss/moduswebcomponents-react';
import { useNavigate, useSearchParams } from 'react-router';
import type { JobInput } from '@jarvis/shared';
import { JobForm } from '../components/JobForm';
import { useCustomers } from '../hooks/useCustomers';
import { useGoBack } from '../hooks/useGoBack';
import { useCreateJob } from '../hooks/useJobs';

/** `/jobs/new`, or `/jobs/new?customerId=…` to start with that customer selected. */
export function NewJobPage() {
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customerId') ?? undefined;
  const { customers, loading, error: loadError } = useCustomers();
  const { create, submitting, error } = useCreateJob();
  const navigate = useNavigate();
  const goBack = useGoBack();

  async function handleSubmit(input: JobInput) {
    const job = await create(input);
    if (job) {
      // Replace the form in the history, so Back from the new job's page returns to where the user came from.
      navigate(`/jobs/${job.id}`, { replace: true });
    }
  }

  function renderContent() {
    if (loading) {
      return <ModusWcLoader aria-label="Loading customers" />;
    }
    if (loadError) {
      return <ModusWcAlert variant="error" alertTitle="Could not load customers" alertDescription={loadError.message} />;
    }
    if (customers.length === 0) {
      return (
        <ModusWcEmptyState
          variant="compact"
          illustration="add_user"
          heading="Add a customer first"
          subtitle="Every job belongs to a customer."
          actionLabel="New customer"
          onActionClick={() => navigate('/customers/new')}
        />
      );
    }
    return (
      <JobForm
        customers={customers}
        initialCustomerId={customerId}
        submitLabel="Create job"
        submitting={submitting}
        serverError={error}
        onSubmit={handleSubmit}
        onCancel={() => goBack(customerId ? `/customers/${customerId}` : '/jobs')}
      />
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>New job</h1>
      </div>
      {renderContent()}
    </>
  );
}
