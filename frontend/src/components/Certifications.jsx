import React from 'react';
import { Award, ExternalLink } from 'lucide-react';

export const Certifications = ({ certifications }) => {
  if (!certifications || certifications.length === 0) return null;

  return (
    <section className="section alt" id="certifications">
      <div className="wrap split">
        <div className="split-head">
          <h2>Certifications</h2>
          <p className="note">Professional credentials & market certifications.</p>
        </div>
        <div className="split-body">
          <div className="cards-grid">
            {certifications.map((cert) => (
              <div className="card" key={cert.id} style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'var(--accent-alpha)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Award size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>{cert.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {cert.issuer} {cert.year ? `• ${cert.year}` : ''}
                    </div>
                  </div>
                  {cert.link && (
                    <a href={cert.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
