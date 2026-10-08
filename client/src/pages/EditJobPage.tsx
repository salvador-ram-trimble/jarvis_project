import { ModusWcAlert, ModusWcLoader } from '@trimble-oss/moduswebcomponents-react';
import { useParams } from 'react-router';
import type { JobInput } from '@jarvis/shared';
import { JobForm } from '../components/JobForm';
import { useCustomers } from '../hooks/useCustomers';
import { useGoBack } from '../hooks/useGoBack';
import { useJob, useUpdateJob } from '../hooks/useJobs';
import { NotFoundPage } from './NotFoundPage';

export function EditJobPage() {
  const { id = '' } = useParams();
  const { job, loading: jobLoading, notFound, error: jobError } = useJob(id);
  const { customers, loading: customersLoading, error: customersError } = useCustomers();
  const { update, submitting, error: saveError } = useUpdateJob();
  const goBack = useGoBack();
  const detailPath = `/jobs/${id}`;

  async function handleSubmit(input: JobInput) {
    if (await update(id, input)) {
      // Back to the detail page, which reloads the job.
      goBack(detailPath);
    }
  }

  if (notFound) {
    return <NotFoundPage title="Job not found" message="This job doesn't exist." />;
  }

  const loadError = jobError ?? customersError;

  return (
    <>
      <div className="page-header">
        <h1>Edit job</h1>
      </div>
      {jobLoading || customersLoading ? (
        <ModusWcLoader aria-label="Loading job" />
      ) : loadError || !job ? (
        <ModusWcAlert variant="error" alertTitle="Could not load the job" alertDescription={loadError?.message} />
      ) : (
        <JobForm
          customers={customers}
          initialJob={job}
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
