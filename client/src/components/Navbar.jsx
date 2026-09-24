import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu, X, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = ({ profile, settings, sections }) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const brandMark = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'HC';

  const brandName = settings?.siteTitle || profile?.name || 'Harshanand Chaudhary';

  const navItems = [
    { key: 'about', label: 'About' },
    { key: 'skills', label: 'Skills' },
    { key: 'education', label: 'Education' },
    { key: 'experience', label: 'Experience' },
    { key: 'projects', label: 'Projects' },
    { key: 'certifications', label: 'Certifications' },
    { key: 'insights', label: 'Market Notes' },
    { key: 'contact', label: 'Contact' },
  ].filter(item => sections?.[item.key] !== false);

  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a href="#top" className="brand">
          <span className="brand-mark">{brandMark}</span>
          <span className="brand-name">{brandName}</span>
        </a>

        <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          {navItems.map(item => (
            <a key={item.key} href={`#${item.key}`} onClick={() => setMobileMenuOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle Theme" title="Toggle Dark/Light Mode">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link to="/admin" className="icon-btn" aria-label="Admin Dashboard" title="Admin Control Panel">
            <ShieldCheck size={18} />
          </Link>

          <button
            className="icon-btn menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
};
