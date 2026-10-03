import React from 'react';

export const Education = ({ education }) => {
  if (!education || education.length === 0) return null;

  return (
    <section className="section" id="education">
      <div className="wrap split">
        <div className="split-head">
          <h2>Education</h2>
          <p className="note">Academic background & foundational studies.</p>
        </div>
        <div className="split-body">
          <ul className="timeline">
            {education.map((item) => (
              <li className="timeline-item" key={item.id}>
                <div className="timeline-card">
                  <div className="timeline-header">
                    <div>
                      <div className="timeline-title">{item.degree || 'Degree Program'}</div>
                      {item.institution && <div className="timeline-org">{item.institution}</div>}
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
