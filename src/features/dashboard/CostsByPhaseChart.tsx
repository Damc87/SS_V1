import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../store/useData';

export function CostsByPhaseChart() {
  const { costs, phases } = useData();
  const data = useMemo(() => {
    return phases.map((p) => ({
      name: p.name,
      value: costs.filter((c) => c.phase_id === p.id).reduce((acc, c) => acc + c.amount_gross, 0),
    }));
  }, [costs, phases]);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#5b8def" radius={[12, 12, 12, 12]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
