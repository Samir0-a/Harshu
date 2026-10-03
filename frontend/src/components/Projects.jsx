import React from 'react';
import { ExternalLink, FolderGit2 } from 'lucide-react';

export const Projects = ({ projects }) => {
  if (!projects || projects.length === 0) return null;

  return (
    <section className="section" id="projects">
      <div className="wrap split">
        <div className="split-head">
          <h2>Projects</h2>
          <p className="note">Financial models, quantitative screens, and research dashboards.</p>
        </div>
        <div className="split-body">
          <div className="cards-grid">
            {projects.map((proj) => (
              <div className="card" key={proj.id}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <FolderGit2 size={24} style={{ color: 'var(--accent)' }} />
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noopener noreferrer" aria-label="View Project">
                        <ExternalLink size={18} />
                      </a>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                    {proj.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    {proj.description}
                  </p>
                </div>
                {proj.tags && (
                  <div className="card-tags">
                    {proj.tags.split(',').map((tag, idx) => (
                      <span className="tag" key={idx}>
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
