'use strict';
/**
 * Starting content, used to auto-populate storage the first time the app
 * runs — whether that's a local JSON file or a fresh Vercel KV database.
 * Editing this file only changes what a brand-new deployment starts with;
 * it does not affect a site that has already been set up.
 */
const DEFAULT_PORTFOLIO = {
  profile: {
    name: 'Harshanand Chaudhary',
    title: 'I am a Financial Markets Enthusiast.',
    tagline: 'I specialize in analyzing Forex and Commodities, combining technical analysis with disciplined risk management and a data-driven mindset.',
    location: 'Kathmandu, Nepal',
    email: 'harshu@gmail.com',
    phone: '',
    photo: '',
    resumeUrl: '',
    linkedin: 'https://linkedin.com/',
    github: 'https://github.com/',
    twitter: '',
    about: 'I’m a financial markets enthusiast with over two years of experience studying and analyzing global markets. My work focuses on understanding market structure, price action, and developing systematic approaches to market analysis. I specialize in analyzing Forex and Commodities, combining technical analysis with disciplined risk management and a data-driven mindset. Through continuous research, analysis, and practical experience, I aim to develop a deeper understanding of financial markets and share my insights, observations, and market perspectives through this platform.',
  },
  settings: {
    siteTitle: 'Harshanand Chaudhary',
    footerText: 'Built with care by samirchaudhary0.com.np',
    accent: '#c9a227',
  },
  sections: {
    about: true, skills: true, education: true, experience: true,
    projects: true, certifications: true, insights: true, contact: true,
  },
  skills: [
    { id: 'skill-01', name: 'Financial modelling', category: 'Finance', level: 90 },
    { id: 'skill-02', name: 'Market Structure Analysis', category: 'Finance', level: 85 },
  ],
  education: [
    {
      id: 'edu-01', institution: '', degree: '', period: '',
      description: "I am currently pursuing my Bachelor’s degree, building a strong foundation in Finance, Accounting, Economics, and Business Management. My academic journey continues to strengthen my understanding of Financial markets, Analytical thinking, and Decision-making.",
    },
  ],
  experience: [
    {
      id: 'exp-01', role: 'Financial Market Enthusiast', org: '', period: '2 years',
      description: 'I specialize in analyzing Forex and Commodities, combining technical analysis with disciplined risk management and a data-driven mindset.',
    },
    {
      id: 'exp-02', role: 'Professional Experience', org: '', period: '',
      description: 'Alongside my academic studies, I have gained practical exposure through professional training and experience. This has helped me connect theoretical knowledge with real-world applications and develop skills in financial analysis, research, accounting, and professional decision-making. I believe that combining academic knowledge with practical experience is essential for building a strong foundation in the financial industry.',
    },
  ],
  projects: [
    {
      id: 'proj-01', title: 'DCF valuation of a listed retailer',
      description: 'Full three-statement model with scenario analysis and a sensitivity table on WACC and terminal growth. Concluded the stock was 18% overvalued under base-case assumptions.',
      tags: 'DCF, Excel, Equity research', link: '',
    },
    {
      id: 'proj-02', title: 'Factor screen for mid-cap stocks',
      description: 'Python notebook that ranks companies on value, quality and momentum, then back-tests a simple monthly rebalance against the index.',
      tags: 'Python, pandas, Back-testing', link: 'https://github.com/',
    },
    {
      id: 'proj-03', title: 'Personal budgeting dashboard',
      description: 'Power BI dashboard that tracks spending by category and projects savings goals; shared with classmates as a template.',
      tags: 'Power BI, Personal finance', link: '',
    },
  ],
  certifications: [
    { id: 'cert-01', name: 'CFA Level I Candidate', issuer: 'CFA Institute', year: '2026', link: '' },
    { id: 'cert-02', name: 'Financial Modeling and Valuation Analyst', issuer: 'Sample Institute', year: '2025', link: '' },
    { id: 'cert-03', name: 'Bloomberg Market Concepts', issuer: 'Bloomberg', year: '2025', link: '' },
  ],
  insights: [
    {
      id: 'ins-01', title: 'Why free cash flow tells you more than earnings',
      summary: 'Earnings can be shaped by accounting choices; cash is harder to dress up. A short walk through three companies where the two told different stories.',
      date: 'August 2026', link: '',
    },
    {
      id: 'ins-02', title: 'Reading a rate cut like an analyst',
      summary: 'What a change in policy rates does to discount rates, and why the effect on growth stocks is larger than most headlines suggest.',
      date: 'June 2026', link: '',
    },
  ],
};

module.exports = { DEFAULT_PORTFOLIO };
