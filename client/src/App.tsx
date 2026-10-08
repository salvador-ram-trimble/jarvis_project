import { Navigate, Route, Routes } from 'react-router';
import { AppShell } from './components/AppShell';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { CustomersListPage } from './pages/CustomersListPage';
import { EditCustomerPage } from './pages/EditCustomerPage';
import { JobsPage } from './pages/JobsPage';
import { NewCustomerPage } from './pages/NewCustomerPage';
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
        <Route path="jobs" element={<JobsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
