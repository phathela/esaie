import React from 'react';
import './Dashboard.css'; // Assuming you have a CSS file for styles

const HubCard = ({ title, content }) => (
  <div className="hub-card">
    <h3>{title}</h3>
    <p>{content}</p>
  </div>
);

const Dashboard = () => {
  const credits = 100; // Example credit amount
  const usdConversionRate = 0.01; // Example conversion rate
  const usdValue = (credits * usdConversionRate).toFixed(2);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="hub-cards">
        {[...Array(9)].map((_, index) => (
          <HubCard key={index} title={`Hub Card ${index + 1}`} content={`Content for hub card ${index + 1}`} />
        ))}
      </div>
      <div className="credits-display">
        <p>Credits: {credits} (Approximately ${usdValue} USD)</p>
      </div>
      <div className="notifications">
        <button className="notification-bell">🔔</button>
      </div>
      <div className="user-menu">
        <button className="user-menu-button">User Menu</button>
        <div className="dropdown-menu">
          <button>Settings</button>
          <button>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;