import { useEffect, useState } from 'react';
import { Layout } from '../layouts/Layout';

export const App = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  return <Layout />;
};
