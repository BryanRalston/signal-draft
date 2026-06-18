/** Survey + dossier templates keyed by use case */
window.SD_TEMPLATES = {
  csat: {
    id: 'csat',
    label: 'Customer satisfaction',
    tag: 'CX / NPS',
    estMinutes: 4,
    questionCount: 12,
    compliance: [
      { id: 'objectives', label: 'All questions map to objectives', status: 'pass' },
      { id: 'length', label: 'Est. 4 min completion', status: 'pass' },
      { id: 'scales', label: 'Validated scales (NPS, Likert)', status: 'pass' },
      { id: 'bias', label: 'Polarity alternation applied', status: 'pass' },
      { id: 'gdpr', label: 'GDPR consent block included', status: 'pass' },
    ],
    dossier: {
      company: {
        title: 'Company analysis',
        body: 'Acme Analytics is a B2B SaaS platform serving mid-market retailers with inventory forecasting. Public positioning emphasizes "predictive clarity" and ROI within 90 days. Primary buyers are operations directors and CFOs at 50–500 employee retailers.',
      },
      competitors: {
        title: 'Competitive landscape',
        body: 'Three direct competitors identified in the forecasting space:',
        items: [
          'ForecastIQ — enterprise-focused, longer implementation cycles, premium pricing',
          'RetailPulse — SMB-friendly but limited API integrations',
          'StockSense — strong on pricing transparency, weaker on predictive accuracy claims',
        ],
        cites: ['acmeanalytics.com/about', 'g2.com/categories/inventory-forecasting', 'capterra.com/inventory-management'],
      },
      market: {
        title: 'Market context',
        body: 'Retail inventory software market growing at ~11% CAGR. Mid-market retailers increasingly expect AI-driven forecasting bundled with existing ERP workflows. Key decision drivers: integration time, forecast accuracy benchmarks, and total cost of ownership.',
        cites: ['mordorintelligence.com/retail-analytics', 'gartner.com/supply-chain-forecasting'],
      },
      objectives: {
        title: 'Research objectives mapped',
        body: 'Survey instrument designed to answer:',
        items: [
          'RO1: Overall satisfaction and likelihood to recommend (NPS benchmark)',
          'RO2: Drivers of satisfaction — product, support, value, onboarding',
          'RO3: Competitive consideration set and switching intent',
          'RO4: Feature gaps blocking expansion or renewal',
        ],
      },
    },
    questions: [
      { n: 1, text: 'How likely are you to recommend Acme Analytics to a colleague or peer?', type: 'NPS 0–10', objective: 'RO1', note: 'Industry-standard NPS; 0=not at all, 10=extremely likely' },
      { n: 2, text: 'Overall, how satisfied are you with Acme Analytics?', type: 'Likert 5-point', objective: 'RO1', note: 'Very dissatisfied → Very satisfied' },
      { n: 3, text: 'Forecast accuracy has met or exceeded our expectations.', type: 'Likert 5-point (agreement)', objective: 'RO2', note: 'Positive polarity' },
      { n: 4, text: 'Onboarding took longer than we anticipated.', type: 'Likert 5-point (agreement)', objective: 'RO2', note: 'Negative polarity — counters acquiescence bias' },
      { n: 5, text: 'How would you rate the value for money of Acme Analytics?', type: 'Semantic differential', objective: 'RO2', note: 'Poor value ↔ Excellent value, 7-point' },
      { n: 6, text: 'When you need inventory forecasting, which solutions do you consider?', type: 'Multiple choice (multi)', objective: 'RO3', note: 'Include Acme + named competitors + Other' },
      { n: 7, text: 'How likely are you to switch to a different provider in the next 12 months?', type: 'Likert 5-point', objective: 'RO3', note: 'Very unlikely → Very likely' },
      { n: 8, text: 'What is the primary reason you chose Acme Analytics over alternatives?', type: 'Open text + AI follow-up', objective: 'RO3', note: 'Probed if response < 20 words' },
      { n: 9, text: 'Which features are most critical to your continued use?', type: 'Ranking (top 3)', objective: 'RO4', note: 'ERP integration, API, dashboards, alerts, mobile' },
      { n: 10, text: 'What is the one improvement that would most increase your satisfaction?', type: 'Open text', objective: 'RO4', note: 'Single priority — avoids laundry lists' },
      { n: 11, text: 'May we contact you for a brief follow-up about your feedback?', type: 'Yes / No', objective: '—', note: 'Optional; separate from anonymous path' },
      { n: 12, text: 'Consent: I understand my responses will be processed per the privacy notice.', type: 'Required checkbox', objective: '—', note: 'GDPR/CCPA compliance block' },
    ],
  },

  employee: {
    id: 'employee',
    label: 'Employee engagement',
    tag: 'HR / EX',
    estMinutes: 5,
    questionCount: 14,
    compliance: [
      { id: 'objectives', label: 'All questions map to objectives', status: 'pass' },
      { id: 'length', label: 'Est. 5 min completion', status: 'pass' },
      { id: 'scales', label: 'Q12-inspired + validated Likert', status: 'pass' },
      { id: 'anonymity', label: 'Anonymity threshold rules set', status: 'pass' },
      { id: 'gdpr', label: 'GDPR consent block included', status: 'pass' },
    ],
    dossier: {
      company: {
        title: 'Company analysis',
        body: 'Northline Health is a 180-employee regional healthcare services group with clinics across three states. Recent growth via acquisition has created integration friction. Leadership is prioritizing culture alignment and retention ahead of a busy hiring season.',
      },
      competitors: {
        title: 'Talent market context',
        body: 'Regional healthcare employers competing for the same clinical and admin talent pool:',
        items: [
          'MetroCare — higher base pay, weaker benefits communication',
          'Summit Medical Group — strong employer brand on social channels',
          'Regional hospital systems — stability narrative, slower career progression',
        ],
        cites: ['northlinehealth.com/careers', 'glassdoor.com/company/northline-health', 'bls.gov/healthcare-employment'],
      },
      market: {
        title: 'Industry benchmarks',
        body: 'Healthcare employee engagement averages 38% engaged (Gallup). Turnover in clinical support roles exceeds 25% annually in many regions. Top drivers: manager quality, scheduling flexibility, and clear growth paths.',
        cites: ['gallup.com/workplace/employee-engagement', 'ahip.org/workforce-trends'],
      },
      objectives: {
        title: 'Research objectives mapped',
        body: 'Survey instrument designed to answer:',
        items: [
          'RO1: Engagement baseline across Q12 dimensions',
          'RO2: Manager effectiveness and communication quality',
          'RO3: Retention risk and intent to stay 12 months',
          'RO4: Post-acquisition integration sentiment',
        ],
      },
    },
    questions: [
      { n: 1, text: 'I know what is expected of me at work.', type: 'Likert 5-point (agreement)', objective: 'RO1', note: 'Gallup Q12 — positive' },
      { n: 2, text: 'I have the materials and equipment I need to do my work right.', type: 'Likert 5-point (agreement)', objective: 'RO1', note: 'Gallup Q12 — positive' },
      { n: 3, text: 'At work, my opinions seem to count.', type: 'Likert 5-point (agreement)', objective: 'RO1', note: 'Gallup Q12 — positive' },
      { n: 4, text: 'In the last seven days, I have received recognition or praise for doing good work.', type: 'Likert 5-point (agreement)', objective: 'RO1', note: 'Gallup Q12 — positive' },
      { n: 5, text: 'My manager does not communicate priorities clearly.', type: 'Likert 5-point (agreement)', objective: 'RO2', note: 'Negative polarity' },
      { n: 6, text: 'I trust my manager to support my professional growth.', type: 'Likert 5-point (agreement)', objective: 'RO2', note: 'Positive polarity' },
      { n: 7, text: 'How likely are you to still be working at Northline Health in 12 months?', type: 'Semantic differential', objective: 'RO3', note: 'Very unlikely → Very likely, 7-point' },
      { n: 8, text: 'What would most influence your decision to stay or leave?', type: 'Multiple choice + Other', objective: 'RO3', note: 'Pay, manager, schedule, growth, culture, commute' },
      { n: 9, text: 'The recent clinic integrations have been communicated effectively.', type: 'Likert 5-point (agreement)', objective: 'RO4', note: 'Acquisition-specific' },
      { n: 10, text: 'I feel like one team across all Northline locations.', type: 'Likert 5-point (agreement)', objective: 'RO4', note: 'Culture integration metric' },
      { n: 11, text: 'What one change would most improve your day-to-day experience?', type: 'Open text', objective: 'RO4', note: 'Single priority question' },
      { n: 12, text: 'Which department/location are you in?', type: 'Dropdown', objective: '—', note: 'For segmentation only; reports aggregated at 5+ responses' },
      { n: 13, text: 'This survey is anonymous. Individual responses will not be shared with managers.', type: 'Info block', objective: '—', note: 'Anonymity assurance — required for honest EX data' },
      { n: 14, text: 'Consent: I understand how my responses will be used per the privacy notice.', type: 'Required checkbox', objective: '—', note: 'GDPR compliance' },
    ],
  },

  competitive: {
    id: 'competitive',
    label: 'Competitive positioning',
    tag: 'Strategy / PMM',
    estMinutes: 6,
    questionCount: 13,
    compliance: [
      { id: 'objectives', label: 'All questions map to objectives', status: 'pass' },
      { id: 'length', label: 'Est. 6 min completion', status: 'warn' },
      { id: 'scales', label: 'Semantic differential + choice tasks', status: 'pass' },
      { id: 'bias', label: 'Blind comparison option included', status: 'pass' },
      { id: 'gdpr', label: 'GDPR consent block included', status: 'pass' },
    ],
    dossier: {
      company: {
        title: 'Company analysis',
        body: 'Brightpath CRM targets professional services firms (legal, accounting, consulting) with a workflow-native CRM. Positioning: "built for how firms actually work." Pricing is mid-market with per-seat annual contracts.',
      },
      competitors: {
        title: 'Competitive landscape',
        body: 'Primary competitors in professional services CRM:',
        items: [
          'Salesforce Financial Services Cloud — dominant, complex, high TCO',
          'HubSpot — strong inbound marketing, weaker matter/case workflow',
          'Clio (legal vertical) — deep vertical features, limited cross-practice',
          'Zoho CRM — price leader, perceived as less premium',
        ],
        cites: ['brightpathcrm.com', 'g2.com/categories/legal-crm', 'hubspot.com/crm'],
      },
      market: {
        title: 'Market context',
        body: 'Professional services firms are consolidating tech stacks. CRM selection increasingly driven by workflow fit over feature breadth. Switching costs remain high — surveys must capture switching barriers and perception gaps, not just feature checklists.',
        cites: ['forrester.com/crm-professional-services', 'mckinsey.com/b2b-sales-tech'],
      },
      objectives: {
        title: 'Research objectives mapped',
        body: 'Survey instrument designed to answer:',
        items: [
          'RO1: Unaided and aided brand awareness in target segment',
          'RO2: Perceptual positioning vs. named competitors',
          'RO3: Win/loss drivers for recent CRM evaluations',
          'RO4: Pricing sensitivity and value perception',
        ],
      },
    },
    questions: [
      { n: 1, text: 'When you think of CRM for professional services, which brands come to mind first?', type: 'Open text (unaided)', objective: 'RO1', note: 'Unaided awareness — no brand list shown' },
      { n: 2, text: 'Which of the following CRM solutions have you heard of?', type: 'Checkbox (aided)', objective: 'RO1', note: 'Brightpath + competitors + None' },
      { n: 3, text: 'Brightpath CRM is built specifically for professional services workflows.', type: 'Likert 5-point (agreement)', objective: 'RO2', note: 'Positioning statement test' },
      { n: 4, text: 'How would you compare Brightpath vs. your current CRM on ease of use?', type: 'Semantic differential', objective: 'RO2', note: 'Much worse ↔ Much better, 7-point' },
      { n: 5, text: 'How would you compare Brightpath vs. your current CRM on value for money?', type: 'Semantic differential', objective: 'RO2', note: 'Much worse ↔ Much better, 7-point' },
      { n: 6, text: 'Have you evaluated a new CRM in the past 18 months?', type: 'Yes / No', objective: 'RO3', note: 'Screening — skip logic if No' },
      { n: 7, text: 'What were the top 3 factors in your decision?', type: 'Ranking', objective: 'RO3', note: 'Price, workflow fit, integrations, support, brand, implementation time' },
      { n: 8, text: 'Why did you choose your current provider over alternatives?', type: 'Open text + AI follow-up', objective: 'RO3', note: 'Win/loss qualitative depth' },
      { n: 9, text: 'What would make you consider switching CRM providers?', type: 'Multiple choice (multi)', objective: 'RO3', note: 'Switching trigger identification' },
      { n: 10, text: 'At what monthly per-seat price would Brightpath feel too expensive to consider?', type: 'Numeric open', objective: 'RO4', note: 'Van Westendorp-style price sensitivity' },
      { n: 11, text: 'At what monthly per-seat price would Brightpath feel like a bargain?', type: 'Numeric open', objective: 'RO4', note: 'Price floor signal' },
      { n: 12, text: 'Which best describes your firm?', type: 'Single choice', objective: '—', note: 'Legal / Accounting / Consulting / Other — segmentation' },
      { n: 13, text: 'Consent: I understand my responses will be processed per the privacy notice.', type: 'Required checkbox', objective: '—', note: 'GDPR compliance' },
    ],
  },
};

window.SD_USE_CASES = [
  { id: 'csat', label: 'Customer satisfaction', desc: 'NPS, satisfaction drivers, churn signals' },
  { id: 'employee', label: 'Employee engagement', desc: 'Q12-based engagement, retention, culture' },
  { id: 'competitive', label: 'Competitive positioning', desc: 'Awareness, perception, win/loss, pricing' },
];