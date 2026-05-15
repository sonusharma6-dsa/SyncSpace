import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="not-found-page">
    <div className="empty-card large">
      <p className="eyebrow">404</p>
      <h1>That page drifted out of the mesh.</h1>
      <p>Try going back to your dashboard or opening a shared note link.</p>
      <div className="empty-actions">
        <Link to="/dashboard" className="primary-button">Back to notes</Link>
        <Link to="/login" className="ghost-button">Login</Link>
      </div>
    </div>
  </div>
);

export default NotFound;
