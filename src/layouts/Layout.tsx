import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { Dashboard } from '../features/dashboard/Dashboard';
import { CostsPage } from '../features/costs/CostsPage';
import { PhasesPage } from '../features/phases/PhasesPage';
import { ContractorsPage } from '../features/contractors/ContractorsPage';
import { DocumentsPage } from '../features/documents/DocumentsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { StyleGuide } from '../features/style-guide/StyleGuide';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useData } from '../store/useData';

export const Layout = () => {
  const [active, setActive] = useState('dashboard');
  const loadAll = useData((s) => s.loadAll);
  const loading = useData((s) => s.loading);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const renderContent = () => {
    switch (active) {
      case 'costs':
        return <CostsPage />;
      case 'phases':
        return <PhasesPage />;
      case 'contractors':
        return <ContractorsPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'style-guide':
        return <StyleGuide />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 text-foreground flex">
      <Sidebar active={active} onChange={setActive} />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <motion.main
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-8 space-y-6"
        >
          {loading ? (
            <div className="rounded-2xl border border-border bg-white/70 backdrop-blur shadow-soft p-6 text-slate-600">Nalaganje …</div>
          ) : (
            renderContent()
          )}
        </motion.main>
      </div>
    </div>
  );
};
