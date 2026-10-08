import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <>
      <div className="page-header">
        <h1>Page not found</h1>
      </div>
      <p>
        There is nothing at this address. <Link to="/customers">Go to customers</Link>
      </p>
    </>
  );
}
