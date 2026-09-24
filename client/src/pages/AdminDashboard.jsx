import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User, Eye, Wrench, GraduationCap, Briefcase, FolderGit2,
  Award, BookOpen, Mail, Key, LogOut, Save, Plus, Trash2, CheckCircle, Upload
} from 'lucide-react';

export const AdminDashboard = () => {
  const { isAuthenticated, logout, authHeader } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [portfolio, setPortfolio] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Password state
  const [passState, setPassState] = useState({ current: '', next: '', confirm: '' });
  const [passMsg, setPassMsg] = useState({ error: null, success: null });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }

    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [portRes, msgRes] = await Promise.all([
        fetch('/api/admin/portfolio', { headers: authHeader() }),
        fetch('/api/admin/messages', { headers: authHeader() })
      ]);

      if (portRes.ok) setPortfolio(await portRes.json());
      if (msgRes.ok) setMessages(await msgRes.json());
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePortfolio = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/admin/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(portfolio)
      });

      if (!res.ok) throw new Error('Save failed.');
      const updated = await res.json();
      setPortfolio(updated);
      setSaveMessage('Portfolio updated successfully!');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch('/api/admin/upload/photo', {
        method: 'POST',
        headers: authHeader(),
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Photo upload failed');

      setPortfolio(prev => ({
        ...prev,
        profile: { ...prev.profile, photo: data.url }
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ error: null, success: null });

    if (passState.next !== passState.confirm) {
      setPassMsg({ error: 'New passwords do not match.', success: null });
      return;
    }

    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ current: passState.current, next: passState.next })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password update failed.');

      setPassMsg({ error: null, success: 'Password changed successfully.' });
      setPassState({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPassMsg({ error: err.message, success: null });
    }
  };

  const toggleMessageRead = async (id, readStatus) => {
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ read: !readStatus })
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, read: !readStatus } : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMessage = async (id) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: authHeader()
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !portfolio) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout wrap" style={{ paddingBottom: '80px' }}>
      {/* Dashboard Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingTop: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>Admin Control Panel</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage website content, sections, & messages</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn primary" onClick={handleSavePortfolio} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Portfolio'}
          </button>
          <button className="btn secondary" onClick={() => { logout(); navigate('/admin/login'); }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {saveMessage && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', padding: '0.85rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} /> {saveMessage}
        </div>
      )}

      {/* Tabs */}
      <nav className="admin-nav">
        {[
          { key: 'profile', label: 'Profile', icon: User },
          { key: 'sections', label: 'Sections', icon: Eye },
          { key: 'skills', label: 'Skills', icon: Wrench },
          { key: 'education', label: 'Education', icon: GraduationCap },
          { key: 'experience', label: 'Experience', icon: Briefcase },
          { key: 'projects', label: 'Projects', icon: FolderGit2 },
          { key: 'certifications', label: 'Certs', icon: Award },
          { key: 'insights', label: 'Market Notes', icon: BookOpen },
          { key: 'messages', label: `Messages (${messages.length})`, icon: Mail },
          { key: 'security', label: 'Security', icon: Key }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </nav>

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <div className="admin-card">
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1.25rem' }}>Profile & Personal Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                className="form-input"
                value={portfolio.profile.name || ''}
                onChange={e => setPortfolio({ ...portfolio, profile: { ...portfolio.profile, name: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>Professional Title</label>
              <input
                className="form-input"
                value={portfolio.profile.title || ''}
                onChange={e => setPortfolio({ ...portfolio, profile: { ...portfolio.profile, title: e.target.value } })}
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Tagline</label>
              <input
                className="form-input"
                value={portfolio.profile.tagline || ''}
                onChange={e => setPortfolio({ ...portfolio, profile: { ...portfolio.profile, tagline: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                className="form-input"
                value={portfolio.profile.location || ''}
                onChange={e => setPortfolio({ ...portfolio, profile: { ...portfolio.profile, location: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                className="form-input"
                value={portfolio.profile.email || ''}
                onChange={e => setPortfolio({ ...portfolio, profile: { ...portfolio.profile, email: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                className="form-input"
                value={portfolio.profile.linkedin || ''}
                onChange={e => setPortfolio({ ...portfolio, profile: { ...portfolio.profile, linkedin: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>GitHub URL</label>
              <input
                className="form-input"
                value={portfolio.profile.github || ''}
                onChange={e => setPortfolio({ ...portfolio, profile: { ...portfolio.profile, github: e.target.value } })}
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Profile Image</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.4rem' }}>
                {portfolio.profile.photo && (
                  <img src={portfolio.profile.photo} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
                )}
                <label className="btn secondary" style={{ cursor: 'pointer' }}>
                  <Upload size={16} /> Choose & Upload Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>About Bio</label>
              <textarea
                className="form-textarea"
                rows={5}
                value={portfolio.profile.about || ''}
                onChange={e => setPortfolio({ ...portfolio, profile: { ...portfolio.profile, about: e.target.value } })}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SECTIONS */}
      {activeTab === 'sections' && (
        <div className="admin-card">
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1.25rem' }}>Section Visibility</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Check sections to enable or disable them on the public portfolio website:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {Object.keys(portfolio.sections).map(sec => (
              <label key={sec} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem', textTransform: 'capitalize', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                  checked={portfolio.sections[sec] !== false}
                  onChange={e => setPortfolio({
                    ...portfolio,
                    sections: { ...portfolio.sections, [sec]: e.target.checked }
                  })}
                />
                {sec}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SKILLS */}
      {activeTab === 'skills' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Skills & Ratings</h2>
            <button
              className="btn secondary"
              onClick={() => setPortfolio({
                ...portfolio,
                skills: [...portfolio.skills, { id: `skill-${Date.now()}`, name: 'New Skill', category: 'Finance', level: 80 }]
              })}
            >
              <Plus size={16} /> Add Skill
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {portfolio.skills.map((skill, idx) => (
              <div key={skill.id || idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '8px' }}>
                <input
                  className="form-input"
                  placeholder="Skill Name"
                  value={skill.name}
                  onChange={e => {
                    const newSkills = [...portfolio.skills];
                    newSkills[idx].name = e.target.value;
                    setPortfolio({ ...portfolio, skills: newSkills });
                  }}
                />
                <input
                  className="form-input"
                  placeholder="Category"
                  value={skill.category}
                  onChange={e => {
                    const newSkills = [...portfolio.skills];
                    newSkills[idx].category = e.target.value;
                    setPortfolio({ ...portfolio, skills: newSkills });
                  }}
                />
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max="100"
                  value={skill.level}
                  onChange={e => {
                    const newSkills = [...portfolio.skills];
                    newSkills[idx].level = Number(e.target.value);
                    setPortfolio({ ...portfolio, skills: newSkills });
                  }}
                />
                <button
                  onClick={() => setPortfolio({ ...portfolio, skills: portfolio.skills.filter((_, i) => i !== idx) })}
                  style={{ color: 'var(--danger)', padding: '0.5rem' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EDUCATION */}
      {activeTab === 'education' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Education Entries</h2>
            <button
              className="btn secondary"
              onClick={() => setPortfolio({
                ...portfolio,
                education: [...portfolio.education, { id: `edu-${Date.now()}`, degree: '', institution: '', period: '', description: '' }]
              })}
            >
              <Plus size={16} /> Add Entry
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {portfolio.education.map((item, idx) => (
              <div key={item.id || idx} style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <strong>Education Entry #{idx + 1}</strong>
                  <button onClick={() => setPortfolio({ ...portfolio, education: portfolio.education.filter((_, i) => i !== idx) })} style={{ color: 'var(--danger)' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <input className="form-input" placeholder="Degree / Program" value={item.degree} onChange={e => {
                    const copy = [...portfolio.education]; copy[idx].degree = e.target.value; setPortfolio({ ...portfolio, education: copy });
                  }} />
                  <input className="form-input" placeholder="Institution" value={item.institution} onChange={e => {
                    const copy = [...portfolio.education]; copy[idx].institution = e.target.value; setPortfolio({ ...portfolio, education: copy });
                  }} />
                  <input className="form-input" placeholder="Period (e.g. 2023 - Present)" value={item.period} onChange={e => {
                    const copy = [...portfolio.education]; copy[idx].period = e.target.value; setPortfolio({ ...portfolio, education: copy });
                  }} />
                </div>
                <textarea className="form-textarea" rows={3} placeholder="Description details..." value={item.description} onChange={e => {
                  const copy = [...portfolio.education]; copy[idx].description = e.target.value; setPortfolio({ ...portfolio, education: copy });
                }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: EXPERIENCE */}
      {activeTab === 'experience' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Work & Training Experience</h2>
            <button
              className="btn secondary"
              onClick={() => setPortfolio({
                ...portfolio,
                experience: [...portfolio.experience, { id: `exp-${Date.now()}`, role: '', org: '', period: '', description: '' }]
              })}
            >
              <Plus size={16} /> Add Role
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {portfolio.experience.map((item, idx) => (
              <div key={item.id || idx} style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <strong>Role #{idx + 1}</strong>
                  <button onClick={() => setPortfolio({ ...portfolio, experience: portfolio.experience.filter((_, i) => i !== idx) })} style={{ color: 'var(--danger)' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <input className="form-input" placeholder="Role / Title" value={item.role} onChange={e => {
                    const copy = [...portfolio.experience]; copy[idx].role = e.target.value; setPortfolio({ ...portfolio, experience: copy });
                  }} />
                  <input className="form-input" placeholder="Organization" value={item.org} onChange={e => {
                    const copy = [...portfolio.experience]; copy[idx].org = e.target.value; setPortfolio({ ...portfolio, experience: copy });
                  }} />
                  <input className="form-input" placeholder="Period" value={item.period} onChange={e => {
                    const copy = [...portfolio.experience]; copy[idx].period = e.target.value; setPortfolio({ ...portfolio, experience: copy });
                  }} />
                </div>
                <textarea className="form-textarea" rows={3} placeholder="Role description..." value={item.description} onChange={e => {
                  const copy = [...portfolio.experience]; copy[idx].description = e.target.value; setPortfolio({ ...portfolio, experience: copy });
                }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Financial & Modeling Projects</h2>
            <button
              className="btn secondary"
              onClick={() => setPortfolio({
                ...portfolio,
                projects: [...portfolio.projects, { id: `proj-${Date.now()}`, title: '', description: '', tags: '', link: '' }]
              })}
            >
              <Plus size={16} /> Add Project
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {portfolio.projects.map((proj, idx) => (
              <div key={proj.id || idx} style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <strong>Project #{idx + 1}</strong>
                  <button onClick={() => setPortfolio({ ...portfolio, projects: portfolio.projects.filter((_, i) => i !== idx) })} style={{ color: 'var(--danger)' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <input className="form-input" placeholder="Project Title" value={proj.title} onChange={e => {
                    const copy = [...portfolio.projects]; copy[idx].title = e.target.value; setPortfolio({ ...portfolio, projects: copy });
                  }} />
                  <input className="form-input" placeholder="Tags (comma separated)" value={proj.tags} onChange={e => {
                    const copy = [...portfolio.projects]; copy[idx].tags = e.target.value; setPortfolio({ ...portfolio, projects: copy });
                  }} />
                </div>
                <input className="form-input" style={{ marginBottom: '0.75rem' }} placeholder="External Link / GitHub URL" value={proj.link} onChange={e => {
                  const copy = [...portfolio.projects]; copy[idx].link = e.target.value; setPortfolio({ ...portfolio, projects: copy });
                }} />
                <textarea className="form-textarea" rows={3} placeholder="Project summary..." value={proj.description} onChange={e => {
                  const copy = [...portfolio.projects]; copy[idx].description = e.target.value; setPortfolio({ ...portfolio, projects: copy });
                }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: CERTIFICATIONS */}
      {activeTab === 'certifications' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Certifications & Credentials</h2>
            <button
              className="btn secondary"
              onClick={() => setPortfolio({
                ...portfolio,
                certifications: [...portfolio.certifications, { id: `cert-${Date.now()}`, name: '', issuer: '', year: '', link: '' }]
              })}
            >
              <Plus size={16} /> Add Cert
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {portfolio.certifications.map((cert, idx) => (
              <div key={cert.id || idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr auto', gap: '0.75rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '8px' }}>
                <input className="form-input" placeholder="Cert Name" value={cert.name} onChange={e => {
                  const copy = [...portfolio.certifications]; copy[idx].name = e.target.value; setPortfolio({ ...portfolio, certifications: copy });
                }} />
                <input className="form-input" placeholder="Issuer" value={cert.issuer} onChange={e => {
                  const copy = [...portfolio.certifications]; copy[idx].issuer = e.target.value; setPortfolio({ ...portfolio, certifications: copy });
                }} />
                <input className="form-input" placeholder="Year" value={cert.year} onChange={e => {
                  const copy = [...portfolio.certifications]; copy[idx].year = e.target.value; setPortfolio({ ...portfolio, certifications: copy });
                }} />
                <input className="form-input" placeholder="Credential Link" value={cert.link} onChange={e => {
                  const copy = [...portfolio.certifications]; copy[idx].link = e.target.value; setPortfolio({ ...portfolio, certifications: copy });
                }} />
                <button onClick={() => setPortfolio({ ...portfolio, certifications: portfolio.certifications.filter((_, i) => i !== idx) })} style={{ color: 'var(--danger)' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Market Notes & Articles</h2>
            <button
              className="btn secondary"
              onClick={() => setPortfolio({
                ...portfolio,
                insights: [...portfolio.insights, { id: `ins-${Date.now()}`, title: '', summary: '', date: '', link: '' }]
              })}
            >
              <Plus size={16} /> Add Note
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {portfolio.insights.map((item, idx) => (
              <div key={item.id || idx} style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <strong>Market Note #{idx + 1}</strong>
                  <button onClick={() => setPortfolio({ ...portfolio, insights: portfolio.insights.filter((_, i) => i !== idx) })} style={{ color: 'var(--danger)' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <input className="form-input" placeholder="Article Title" value={item.title} onChange={e => {
                    const copy = [...portfolio.insights]; copy[idx].title = e.target.value; setPortfolio({ ...portfolio, insights: copy });
                  }} />
                  <input className="form-input" placeholder="Date (e.g. August 2026)" value={item.date} onChange={e => {
                    const copy = [...portfolio.insights]; copy[idx].date = e.target.value; setPortfolio({ ...portfolio, insights: copy });
                  }} />
                </div>
                <input className="form-input" style={{ marginBottom: '0.75rem' }} placeholder="Article Link" value={item.link} onChange={e => {
                  const copy = [...portfolio.insights]; copy[idx].link = e.target.value; setPortfolio({ ...portfolio, insights: copy });
                }} />
                <textarea className="form-textarea" rows={3} placeholder="Article summary..." value={item.summary} onChange={e => {
                  const copy = [...portfolio.insights]; copy[idx].summary = e.target.value; setPortfolio({ ...portfolio, insights: copy });
                }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: MESSAGES */}
      {activeTab === 'messages' && (
        <div className="admin-card">
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1.25rem' }}>Contact Form Inbox</h2>
          {messages.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No messages received yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', borderLeft: msg.read ? '4px solid var(--border-color)' : '4px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <strong style={{ fontSize: '1.05rem' }}>{msg.name}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.75rem' }}>({msg.email})</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(msg.date).toLocaleDateString()}
                      </span>
                      <button className="btn secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => toggleMessageRead(msg.id, msg.read)}>
                        {msg.read ? 'Mark Unread' : 'Mark Read'}
                      </button>
                      <button onClick={() => deleteMessage(msg.id)} style={{ color: 'var(--danger)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 10: SECURITY */}
      {activeTab === 'security' && (
        <div className="admin-card" style={{ maxWidth: '500px' }}>
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1.25rem' }}>Change Admin Password</h2>

          {passMsg.error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{passMsg.error}</p>}
          {passMsg.success && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{passMsg.success}</p>}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" className="form-input" required value={passState.current} onChange={e => setPassState({ ...passState, current: e.target.value })} />
            </div>
            <div className="form-group">
              <label>New Password (min 8 chars)</label>
              <input type="password" className="form-input" required minLength={8} value={passState.next} onChange={e => setPassState({ ...passState, next: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" className="form-input" required minLength={8} value={passState.confirm} onChange={e => setPassState({ ...passState, confirm: e.target.value })} />
            </div>
            <button type="submit" className="btn primary">Update Password</button>
          </form>
        </div>
      )}
    </div>
  );
};
