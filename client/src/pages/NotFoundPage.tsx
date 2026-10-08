import { ModusWcEmptyState } from '@trimble-oss/moduswebcomponents-react';
import { useNavigate } from 'react-router';

interface NotFoundPageProps {
  title?: string;
  message?: string;
}

/** Shown for unknown routes, and by detail and edit pages when the record doesn't exist. */
export function NotFoundPage({
  title = 'Page not found',
  message = 'There is nothing at this address.',
}: NotFoundPageProps) {
  const navigate = useNavigate();

  return (
    <ModusWcEmptyState
      variant="error"
      illustration="error_404_page"
      heading={title}
      subtitle={message}
      actionLabel="Go to customers"
      onActionClick={() => navigate('/customers')}
    />
  );
}
