import { ModusWcBadge } from '@trimble-oss/moduswebcomponents-react';
import { JOB_STATUS_LABELS, type JobStatus } from '@jarvis/shared';

const STATUS_COLORS = {
  scheduled: 'primary',
  in_progress: 'warning',
  done: 'success',
  cancelled: 'secondary',
} as const satisfies Record<JobStatus, string>;

export function JobStatusBadge({ status }: { status: JobStatus }) {
  // Modus gives badges an alert or status role, which screen readers announce as live updates.
  // A job's status is a plain label, so the role is turned off.
  return (
    <ModusWcBadge color={STATUS_COLORS[status]} variant="filled" role="none">
      {JOB_STATUS_LABELS[status]}
    </ModusWcBadge>
  );
}
