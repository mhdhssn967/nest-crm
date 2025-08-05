import React from 'react';
import './UpcomingFollowUps.css';

const UpcomingFollowUps = ({ records }) => {
  // Get today's date (set time to 00:00)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get date 7 days from now
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(today.getDate() + 7);
  sevenDaysLater.setHours(23, 59, 59, 999);

  // Filter & sort follow-ups within the next 7 days
  const upcomingFollowUps = records
    .filter(record => {
      if (!record.nextFollowUp) return false;
      const followUpDate = new Date(record.nextFollowUp);
      return followUpDate >= today && followUpDate <= sevenDaysLater;
    })
    .sort((a, b) => new Date(a.nextFollowUp) - new Date(b.nextFollowUp));

  return (
    <div className='up-follows'>
      <h2>Upcoming Follow-Ups (Next 7 Days)</h2>
      {upcomingFollowUps.length === 0 ? (
        <p>No follow-ups in the next 7 days.</p>
      ) : (
        <ul className="follow-up-list">
          {upcomingFollowUps.map((item) => (
            <li key={item.id} className="follow-up-item">
              <strong>{item.clientName || "Unnamed Client"}</strong>
              <span>{item.employeeName || "N/A"}</span>
<span>
   {new Date(item.nextFollowUp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })}
</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UpcomingFollowUps;
