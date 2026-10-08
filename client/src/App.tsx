import { Navigate, Route, Routes } from 'react-router';
import { AppShell } from './components/AppShell';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { CustomersListPage } from './pages/CustomersListPage';
import { EditCustomerPage } from './pages/EditCustomerPage';
import { EditJobPage } from './pages/EditJobPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { JobsListPage } from './pages/JobsListPage';
import { NewCustomerPage } from './pages/NewCustomerPage';
import { NewJobPage } from './pages/NewJobPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/customers" replace />} />
        <Route path="customers" element={<CustomersListPage />} />
        <Route path="customers/new" element={<NewCustomerPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="customers/:id/edit" element={<EditCustomerPage />} />
        <Route path="jobs" element={<JobsListPage />} />
        <Route path="jobs/new" element={<NewJobPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="jobs/:id/edit" element={<EditJobPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
