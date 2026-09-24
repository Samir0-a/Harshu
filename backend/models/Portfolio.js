'use strict';

const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, default: 'Finance' },
  level: { type: Number, default: 80, min: 0, max: 100 }
}, { _id: false });

const educationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  institution: { type: String, default: '' },
  degree: { type: String, default: '' },
  period: { type: String, default: '' },
  description: { type: String, default: '' }
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  id: { type: String, required: true },
  role: { type: String, default: '' },
  org: { type: String, default: '' },
  period: { type: String, default: '' },
  description: { type: String, default: '' }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  tags: { type: String, default: '' },
  link: { type: String, default: '' }
}, { _id: false });

const certificationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, default: '' },
  issuer: { type: String, default: '' },
  year: { type: String, default: '' },
  link: { type: String, default: '' }
}, { _id: false });

const insightSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, default: '' },
  summary: { type: String, default: '' },
  date: { type: String, default: '' },
  link: { type: String, default: '' }
}, { _id: false });

const portfolioSchema = new mongoose.Schema({
  profile: {
    name: { type: String, default: 'Harshanand Chaudhary' },
    title: { type: String, default: '' },
    tagline: { type: String, default: '' },
    location: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    photo: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    twitter: { type: String, default: '' },
    about: { type: String, default: '' }
  },
  settings: {
    siteTitle: { type: String, default: 'Harshanand Chaudhary' },
    footerText: { type: String, default: '' },
    accent: { type: String, default: '#c9a227' }
  },
  sections: {
    about: { type: Boolean, default: true },
    skills: { type: Boolean, default: true },
    education: { type: Boolean, default: true },
    experience: { type: Boolean, default: true },
    projects: { type: Boolean, default: true },
    certifications: { type: Boolean, default: true },
    insights: { type: Boolean, default: true },
    contact: { type: Boolean, default: true }
  },
  skills: [skillSchema],
  education: [educationSchema],
  experience: [experienceSchema],
  projects: [projectSchema],
  certifications: [certificationSchema],
  insights: [insightSchema]
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
