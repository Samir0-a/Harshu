import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Mail, MapPin } from 'lucide-react';

export const Contact = ({ profile }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '', website: '' });
  const [status, setStatus] = useState({ loading: false, success: false, error: null });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.message) {
      setStatus({ loading: false, success: false, error: 'Please enter your name and message.' });
      return;
    }

    setStatus({ loading: true, success: false, error: null });

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      setStatus({ loading: false, success: true, error: null });
      setFormData({ name: '', email: '', message: '', website: '' });
    } catch (err) {
      setStatus({ loading: false, success: false, error: err.message });
    }
  };

  return (
    <section className="section contact" id="contact">
      <div className="wrap split">
        <div className="split-head">
          <h2>Get In Touch</h2>
          <p className="note">Open to discussions on markets, investment research, and graduate roles.</p>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            {profile?.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Mail size={16} style={{ color: 'var(--accent)' }} />
                <span>{profile.email}</span>
              </div>
            )}
            {profile?.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MapPin size={16} style={{ color: 'var(--accent)' }} />
                <span>{profile.location}</span>
              </div>
            )}
          </div>
        </div>

        <div className="split-body">
          <form className="contact-form" onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  className="form-input"
                  required
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>Your Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="form-input"
                  required
                  maxLength={150}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Share your inquiry or project details..."
                rows={5}
                className="form-textarea"
                required
                maxLength={3000}
              />
            </div>

            {/* Honeypot for spam bots */}
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="hp"
              tabIndex={-1}
              autoComplete="off"
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="submit" className="btn primary" disabled={status.loading}>
                <Send size={16} />
                {status.loading ? 'Sending...' : 'Send Message'}
              </button>

              {status.success && (
                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                  <CheckCircle size={16} /> Message sent successfully!
                </span>
              )}

              {status.error && (
                <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                  <AlertCircle size={16} /> {status.error}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
