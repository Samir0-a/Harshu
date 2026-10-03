import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { About } from '../components/About';
import { Skills } from '../components/Skills';
import { Education } from '../components/Education';
import { Experience } from '../components/Experience';
import { Projects } from '../components/Projects';
import { Certifications } from '../components/Certifications';
import { Insights } from '../components/Insights';
import { Contact } from '../components/Contact';
import { Footer } from '../components/Footer';

export const PortfolioPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portfolio')
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load portfolio:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="brand-mark" style={{ width: '48px', height: '48px', fontSize: '1.2rem', margin: '0 auto 1rem' }}>
            HC
          </div>
          <p>Loading Finance Portfolio...</p>
        </div>
      </div>
    );
  }

  const { profile, settings, sections, skills, education, experience, projects, certifications, insights } = data || {};

  return (
    <div>
      <Navbar profile={profile} settings={settings} sections={sections} />
      <Hero profile={profile} />

      {sections?.about !== false && <About profile={profile} />}
      {sections?.skills !== false && <Skills skills={skills} />}
      {sections?.education !== false && <Education education={education} />}
      {sections?.experience !== false && <Experience experience={experience} />}
      {sections?.projects !== false && <Projects projects={projects} />}
      {sections?.certifications !== false && <Certifications certifications={certifications} />}
      {sections?.insights !== false && <Insights insights={insights} />}
      {sections?.contact !== false && <Contact profile={profile} />}

      <Footer settings={settings} />
    </div>
  );
};
