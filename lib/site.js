function getSiteUrl() {
  return (process.env.SITE_URL || 'https://signal-draft-bryanralstons-projects.vercel.app').replace(/\/$/, '');
}

module.exports = { getSiteUrl };