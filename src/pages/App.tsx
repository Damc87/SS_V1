import { Navigate, Route, Routes, HashRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/Layout';
import { Dashboard } from '../features/dashboard/Dashboard';
import { ProjectsPage } from '../features/projects/ProjectsPage';
import { PhasesPage } from '../features/phases/PhasesPage';
import { CostsPage } from '../features/costs/CostsPage';
import { ContractorsPage } from '../features/contractors/ContractorsPage';
import { DocumentsPage } from '../features/documents/DocumentsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { Toaster } from 'sonner';

export const App = () => {
  return (
    <HashRouter>
      <Toaster position="top-right" richColors duration={3200} />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/projekti" element={<ProjectsPage />} />
          <Route path="/faze" element={<PhasesPage />} />
          <Route path="/stroski" element={<CostsPage />} />
          <Route path="/izvajalci" element={<ContractorsPage />} />
          <Route path="/dokumenti" element={<DocumentsPage />} />
          <Route path="/nastavitve" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};
