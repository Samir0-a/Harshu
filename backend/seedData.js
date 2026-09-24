'use strict';

const DEFAULT_PORTFOLIO = {
  profile: {
    name: 'Harshanand Chaudhary',
    title: 'Financial Markets Enthusiast & Analyst',
    tagline: 'I specialize in analyzing Forex and Commodities, combining technical analysis with disciplined risk management and a data-driven mindset.',
    location: 'Kathmandu, Nepal',
    email: 'harshu@gmail.com',
    phone: '',
    photo: '',
    resumeUrl: '',
    linkedin: 'https://linkedin.com/',
    github: 'https://github.com/',
    twitter: '',
    about: 'I’m a financial markets enthusiast with over two years of experience studying and analyzing global markets. My work focuses on understanding market structure, price action, and developing systematic approaches to market analysis. I specialize in analyzing Forex and Commodities, combining technical analysis with disciplined risk management and a data-driven mindset. Through continuous research, analysis, and practical experience, I aim to develop a deeper understanding of financial markets and share my insights, observations, and market perspectives through this platform.'
  },
  settings: {
    siteTitle: 'Harshanand Chaudhary | Finance Portfolio',
    footerText: 'Built with care by samirchaudhary0.com.np',
    accent: '#c9a227'
  },
  sections: {
    about: true,
    skills: true,
    education: true,
    experience: true,
    projects: true,
    certifications: true,
    insights: true,
    contact: true
  },
  skills: [
    { id: 'skill-01', name: 'Financial Modelling', category: 'Finance', level: 90 },
    { id: 'skill-02', name: 'Market Structure Analysis', category: 'Finance', level: 85 },
    { id: 'skill-03', name: 'Forex & Commodities Technical Analysis', category: 'Finance', level: 88 },
    { id: 'skill-04', name: 'Risk Management & Position Sizing', category: 'Trading', level: 92 },
    { id: 'skill-05', name: 'Macroeconomic Data Interpretation', category: 'Economics', level: 82 },
    { id: 'skill-06', name: 'Python & Data Back-testing', category: 'Analytics', level: 78 }
  ],
  education: [
    {
      id: 'edu-01',
      institution: 'Tribhuvan University',
      degree: 'Bachelor of Business Studies (Finance)',
      period: '2023 - Present',
      description: 'Building a strong foundation in Finance, Accounting, Economics, and Business Management. My academic journey continues to strengthen my understanding of Financial markets, Analytical thinking, and Decision-making.'
    }
  ],
  experience: [
    {
      id: 'exp-01',
      role: 'Financial Market Analyst & Trader',
      org: 'Independent Research',
      period: '2023 - Present',
      description: 'Specializing in analyzing Forex and Commodities, combining price action analysis with disciplined risk management strategies and data-driven market tracking.'
    },
    {
      id: 'exp-02',
      role: 'Financial Research & Analytics Trainee',
      org: 'Professional Exposure',
      period: '2024 - 2025',
      description: 'Connected theoretical academic knowledge with real-world applications in financial analysis, corporate financial reporting, risk assessment, and market insights.'
    }
  ],
  projects: [
    {
      id: 'proj-01',
      title: 'DCF Valuation Model of Listed Retailer',
      description: 'Full three-statement model with scenario analysis and a sensitivity matrix on WACC and terminal growth rates. Concluded stock valuation under base-case assumptions.',
      tags: 'DCF, Financial Modeling, Equity Research',
      link: ''
    },
    {
      id: 'proj-02',
      title: 'Factor Screening for Mid-Cap Equities',
      description: 'Python framework that ranks equities on value, quality, and momentum metrics with automated back-testing against benchmark indices.',
      tags: 'Python, Pandas, Back-testing',
      link: 'https://github.com/'
    },
    {
      id: 'proj-03',
      title: 'Personal Budgeting & Portfolio Analytics Dashboard',
      description: 'Interactive financial dashboard tracking asset allocation, expense categorizations, and savings growth trajectory.',
      tags: 'Power BI, Portfolio Management',
      link: ''
    }
  ],
  certifications: [
    { id: 'cert-01', name: 'CFA Level I Candidate', issuer: 'CFA Institute', year: '2026', link: '' },
    { id: 'cert-02', name: 'Financial Modeling & Valuation Analyst (FMVA)', issuer: 'CFI', year: '2025', link: '' },
    { id: 'cert-03', name: 'Bloomberg Market Concepts (BMC)', issuer: 'Bloomberg', year: '2025', link: '' }
  ],
  insights: [
    {
      id: 'ins-01',
      title: 'Why Free Cash Flow Tells You More Than Reported Earnings',
      summary: 'Accounting choices can disguise operating realities. A comparative analysis of operating cash flows versus net income in high-growth firms.',
      date: 'August 2026',
      link: ''
    },
    {
      id: 'ins-02',
      title: 'Decoding Central Bank Interest Rate Pivots',
      summary: 'How shifting central bank interest rate trajectories recalculate equity discount factors and commodity pricing dynamics.',
      date: 'June 2026',
      link: ''
    }
  ]
};

module.exports = { DEFAULT_PORTFOLIO };
