import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';

export const Insights = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <section className="section" id="insights">
      <div className="wrap split">
        <div className="split-head">
          <h2>Market Notes</h2>
          <p className="note">Analytical perspectives, macroeconomic readings & research notes.</p>
        </div>
        <div className="split-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {insights.map((item) => (
              <div className="card" key={item.id} style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <BookOpen size={18} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date}</span>
                  </div>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                  {item.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  {item.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
