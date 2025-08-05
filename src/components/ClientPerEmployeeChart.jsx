import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const ClientsPerEmployeeChart = ({ records }) => {
  // Aggregate client counts per employee ID
  const employeeDataMap = {};

  records.forEach(record => {
    const { associate, employeeName } = record;

    if (!employeeDataMap[associate]) {
      employeeDataMap[associate] = {
        employeeId: associate,
        employeeName,
        clientCount: 0
      };
    }

    employeeDataMap[associate].clientCount += 1;
  });

  const chartData = Object.values(employeeDataMap);

  return (
    <div style={{ width: 1200, height: 350,margin:'2rem' }}>
      <h5>Clients per Employee</h5>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="employeeName" angle={-45} textAnchor="end" interval={0} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar barSize={10}  dataKey="clientCount" fill="#82ca9d">
            <LabelList dataKey="clientCount" position="top" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClientsPerEmployeeChart;
