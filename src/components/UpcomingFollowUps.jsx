import React, { useState } from 'react';
import './UpcomingFollowUps.css';

import {
  CalendarEvent,
  PersonFill,
  PeopleFill
} from "react-bootstrap-icons";

const UpcomingFollowUps = ({ records }) => {
  const [showAll, setShowAll] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(today.getDate() + 7);
  sevenDaysLater.setHours(23, 59, 59, 999);

  const upcomingFollowUps = records
    .filter((record) => {
      if (!record.nextFollowUp) return false;
      const date = new Date(record.nextFollowUp);
      return date >= today && date <= sevenDaysLater;
    })
    .sort((a, b) => new Date(a.nextFollowUp) - new Date(b.nextFollowUp));

  // show only first 2 if not expanded
  const displayed = showAll
    ? upcomingFollowUps
    : upcomingFollowUps.slice(0, 2);

  return (
    <div className="up-follows-card">
      <h3 className="up-title">
        <CalendarEvent size={20} style={{ marginRight: 8 }} />
        Upcoming Follow-Ups (Next 7 Days)
      </h3>

      {upcomingFollowUps.length === 0 ? (
        <p className="no-upcoming">No follow-ups in the next 7 days.</p>
      ) : (
        <ul className="follow-up-list-modern">
          {displayed.map((item) => (
            <li key={item.id} className="follow-up-item-modern">
              {/* Name + Employee */}
              <div className="follow-left">
                <div className="client-name">
                  <PeopleFill size={18} className="icon" />{" "}
                  {item.clientName || "Unnamed Client"}
                </div>
                <div className="emp-name">
                  <PersonFill size={16} className="icon-muted" />{" "}
                  {item.employeeName || "N/A"}
                </div>
              </div>

              {/* Date */}
              <div className="follow-date">
                {new Date(item.nextFollowUp).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* See More / See Less */}
      {upcomingFollowUps.length > 2 && (
        <button
          className="see-more-btn"
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "See Less" : "See More"}
        </button>
      )}
    </div>
  );
};

export default UpcomingFollowUps;


