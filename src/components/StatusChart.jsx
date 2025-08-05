import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1',
  '#a4de6c', '#d0ed57', '#ffbb28', '#ff6666', '#aa66cc'
];

const StatusChart = ({ records }) => {
  // Group by currentStatus
  const statusCounts = records.reduce((acc, record) => {
    const status = record.currentStatus?.trim() || 'Unassigned';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Format for Recharts
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '2rem auto' }}>
      <h5 style={{ textAlign: 'center' }}>Client Status Distribution</h5>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={110}
            label={({ name, percent }) =>
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [`${value} clients`, name]} />
          {/* <Legend verticalAlign="bottom" height={36} /> */}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusChart;
