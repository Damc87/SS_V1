import { useEffect, useState } from 'react';
import { Layout } from '../layouts/Layout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Toaster } from 'sonner';

export const App = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50 text-slate-700">
        <div className="rounded-2xl border border-border bg-white px-6 py-4 shadow-soft">Loading …</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Layout />
      <Toaster position="top-right" richColors />
    </ErrorBoundary>
  );
};
