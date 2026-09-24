import React from 'react';

export const Experience = ({ experience }) => {
  if (!experience || experience.length === 0) return null;

  return (
    <section className="section alt" id="experience">
      <div className="wrap split">
        <div className="split-head">
          <h2>Experience</h2>
          <p className="note">Market analysis, practical training & analytical achievements.</p>
        </div>
        <div className="split-body">
          <ul className="timeline">
            {experience.map((item) => (
              <li className="timeline-item" key={item.id}>
                <div className="timeline-card">
                  <div className="timeline-header">
                    <div>
                      <div className="timeline-title">{item.role || 'Role'}</div>
                      {item.org && <div className="timeline-org">{item.org}</div>}
                    </div>
                    {item.period && <span className="timeline-period">{item.period}</span>}
                  </div>
                  {item.description && (
                    <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      {item.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
