import React from 'react';

export const About = ({ profile }) => {
  if (!profile || !profile.about) return null;

  return (
    <section className="section" id="about">
      <div className="wrap split">
        <div className="split-head">
          <h2>About Me</h2>
          {profile.photo && (
            <div style={{ marginTop: '1.5rem' }}>
              <img
                src={profile.photo}
                alt={profile.name}
                style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '16px',
                  objectFit: 'cover',
                  border: '2px solid var(--border-highlight)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              />
            </div>
          )}
        </div>
        <div className="split-body" style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          <p>{profile.about}</p>
        </div>
      </div>
    </section>
  );
};
