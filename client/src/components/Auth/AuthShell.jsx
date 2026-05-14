import React from 'react';
import { Link } from 'react-router-dom';

const AuthShell = ({ eyebrow, title, description, children, footer }) => (
  <div className="auth-page">
    <section className="auth-hero">
      <div className="auth-brand-row">
        <span className="brand-mark">◌</span>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
      </div>
      <p className="auth-description">{description}</p>
      <div className="auth-card">{children}</div>
      <div className="auth-footer-copy">{footer}</div>
      <Link to="/dashboard" className="auth-secondary-link">Preview the protected app shell</Link>
    </section>
  </div>
);

export default AuthShell;
