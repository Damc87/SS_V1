import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { LoadingScreen } from '../components/LoadingScreen';
import { useData } from '../store/useData';
import { toast } from 'sonner';
import { useTheme } from '../store/useTheme';

export const AppLayout = () => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const loadAll = useData((s) => s.loadAll);
  const loading = useData((s) => s.loading);
  const location = useLocation();
  const { initialize } = useTheme();

  useEffect(() => {
    loadAll().catch((error) => {
      console.error(error);
      toast.error('Nalaganje podatkov ni uspelo, prosimo preverite API.');
    });
  }, [loadAll]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem('sidebar-collapsed', next.toString());
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <div className="flex-1 overflow-auto">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6 sm:p-8 space-y-8"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>
      {loading && <LoadingScreen variant="overlay" message="Pripravljam podatke ..." />}
    </div>
  );
};
