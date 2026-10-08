import { Navigate, Route, Routes } from 'react-router';
import { AppShell } from './components/AppShell';
import { CustomersListPage } from './pages/CustomersListPage';
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
        <Route path="jobs" element={<JobsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
