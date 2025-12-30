import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { LoadingScreen } from '../components/LoadingScreen';
import { useData } from '../store/useData';
import { toast } from 'sonner';

export const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const loadAll = useData((s) => s.loadAll);
  const loading = useData((s) => s.loading);
  const location = useLocation();

  useEffect(() => {
    loadAll().catch((error) => {
      console.error(error);
      toast.error('Nalaganje podatkov ni uspelo, prosimo preverite API.');
    });
  }, [loadAll]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 text-foreground flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <div className="flex-1 overflow-auto">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6 sm:p-8 space-y-6"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>
      {loading && <LoadingScreen variant="overlay" message="Pripravljam podatke ..." />}
    </div>
  );
};
