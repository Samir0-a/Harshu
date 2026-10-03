import React from 'react';

export const Skills = ({ skills }) => {
  if (!skills || skills.length === 0) return null;

  return (
    <section className="section alt" id="skills">
      <div className="wrap split">
        <div className="split-head">
          <h2>Core Skills</h2>
          <p className="note">Assessed analytical proficiency & market expertise scale (0–100).</p>
        </div>
        <div className="split-body">
          <div className="skills-grid">
            {skills.map((skill) => (
              <div className="skill-item" key={skill.id || skill.name}>
                <div className="skill-info">
                  <span className="skill-name">{skill.name}</span>
                  <span className="skill-category">{skill.category}</span>
                  <span className="skill-score">{skill.level}%</span>
                </div>
                <div className="skill-bar-bg">
                  <div
                    className="skill-bar-fill"
                    style={{ width: `${Math.min(100, Math.max(0, skill.level))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
