import { ModusWcAlert, ModusWcButton, ModusWcLoader } from '@trimble-oss/moduswebcomponents-react';
import { Link, useNavigate, useParams } from 'react-router';
import type { Job } from '@jarvis/shared';
import { addressBlock, Detail } from '../components/Detail';
import { JobStatusBadge } from '../components/JobStatusBadge';
import { formatCalendarDate, formatDateTime, formatPrice } from '../format';
import { useJob } from '../hooks/useJobs';
import { NotFoundPage } from './NotFoundPage';

function JobDetails({ job }: { job: Job }) {
  return (
    <dl className="details">
      <Detail label="Customer">
        <Link to={`/customers/${job.customer.id}`}>{job.customer.name}</Link>
      </Detail>
      <Detail label="Status">
        <JobStatusBadge status={job.status} />
      </Detail>
      <Detail label="Price">{job.price === undefined ? undefined : formatPrice(job.price)}</Detail>
      <Detail label="Scheduled start">{job.scheduledStart && formatCalendarDate(job.scheduledStart)}</Detail>
      <Detail label="Scheduled end">{job.scheduledEnd && formatCalendarDate(job.scheduledEnd)}</Detail>
      <Detail label="Site address">{addressBlock(job.siteAddress)}</Detail>
      <Detail label="Description">{job.description && <p className="notes">{job.description}</p>}</Detail>
      <Detail label="Created">{formatDateTime(job.createdAt)}</Detail>
      <Detail label="Last updated">{formatDateTime(job.updatedAt)}</Detail>
    </dl>
  );
}

export function JobDetailPage() {
  const { id = '' } = useParams();
  const { job, loading, notFound, error } = useJob(id);
  const navigate = useNavigate();

  if (notFound) {
    return <NotFoundPage title="Job not found" message="This job doesn't exist." />;
  }

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/jobs">Jobs</Link>
      </nav>
      {loading ? (
        <ModusWcLoader aria-label="Loading job" />
      ) : error || !job ? (
        <ModusWcAlert variant="error" alertTitle="Could not load the job" alertDescription={error?.message} />
      ) : (
        <>
          <div className="page-header">
            <h1>{job.title}</h1>
            <ModusWcButton onButtonClick={() => navigate(`/jobs/${job.id}/edit`)}>Edit</ModusWcButton>
          </div>
          <JobDetails job={job} />
        </>
      )}
    </>
  );
}
