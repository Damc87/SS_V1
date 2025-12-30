import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../../store/useData';

export function TopContractorsChart() {
  const { costs, contractors } = useData();
  const data = useMemo(() => {
    const decorated = contractors
      .map((c) => ({
        name: c.name,
        value: costs.filter((cost) => cost.contractor_id === c.id).reduce((acc, cost) => acc + cost.amount_gross, 0),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    if (!decorated.length) {
      return [
        { name: 'Vzorčni izvajalec', value: 2200 },
        { name: 'Dobavitelj', value: 1300 },
      ];
    }
    return decorated;
  }, [contractors, costs]);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={140} axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#1e293b" radius={[12, 12, 12, 12]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
