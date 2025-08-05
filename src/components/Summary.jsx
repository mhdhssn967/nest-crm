import { useEffect, useState } from 'react';
import './Summary.css'

const Summary = ({setSelectedStatus,selectedStatus, displayRecords, getStatusColor }) => {
    
  const [summary, setSummary] = useState({
    totalClients: 0,
    statusCounts: {},
    unassignedStatusCount: 0,
  });

  useEffect(() => {
    if (!displayRecords || displayRecords.length === 0) return;

    const tempSummary = {
      totalClients: 0,
      statusCounts: {},
      unassignedStatusCount: 0,
    };

    displayRecords.forEach((client) => {
      tempSummary.totalClients++;

      const status = client.currentStatus?.trim();

      if (!status) {
        tempSummary.unassignedStatusCount++;
      } else {
        if (!tempSummary.statusCounts[status]) {
          tempSummary.statusCounts[status] = 0;
        }
        tempSummary.statusCounts[status]++;
      }
    });

    setSummary(tempSummary);
  }, [displayRecords]);

  return (
    <div className='summary'>
  <ul>
    <li
      onClick={() => setSelectedStatus('all')}
      style={{
        outline: selectedStatus == 'all' ? '1px solid #000' : 'none',
        borderRadius: '25px',
        padding: '5px 10px',
        cursor: 'pointer'
      }}
    >
      All Clients: <span>{summary.totalClients}</span>
    </li>

    <li
      onClick={() => setSelectedStatus('')}
      style={{
        outlinr: selectedStatus === '' ? '1px solid #000' : 'none',
        borderRadius: '25px',
        padding: '5px 10px',
        cursor: 'pointer'
      }}
    >
      Unassigned Status: <span>{summary.unassignedStatusCount}</span>
    </li>

    {Object.entries(summary.statusCounts).map(([status, count]) => (
      <li
        key={status}
        onClick={() => setSelectedStatus(status)}
        style={{
          outline: selectedStatus === status ? '1px solid #000' : 'none',
          borderRadius: '25px',
          padding: '5px 10px',
          cursor: 'pointer',
          backgroundColor: getStatusColor(status)
        }}
      >
        {status}: <span>{count}</span>
      </li>
    ))}
  </ul>
</div>

  );
};

export default Summary;
