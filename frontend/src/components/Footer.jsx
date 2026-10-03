import React from 'react';
import { ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = ({ settings }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div>
          <p>{settings?.footerText || `© ${currentYear} All rights reserved.`}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link to="/admin" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Admin Portal
          </Link>
          <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
            Back to Top <ArrowUp size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
};
