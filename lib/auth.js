const crypto = require('crypto');

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

function sessionSecret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'change-me';
}

function createAdminToken() {
  const exp = Date.now() + SESSION_MS;
  const payload = JSON.stringify({ role: 'admin', exp });
  const sig = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ payload, sig })).toString('base64url');
}

function verifyAdminToken(token) {
  if (!token) return false;
  try {
    const { payload, sig } = JSON.parse(Buffer.from(token, 'base64url').toString());
    const expected = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('hex');
    if (sig !== expected || sig.length !== expected.length) return false;
    const data = JSON.parse(payload);
    return data.role === 'admin' && Date.now() < data.exp;
  } catch {
    return false;
  }
}

function getBearerToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

function requireAdmin(req, res) {
  const token = getBearerToken(req);
  if (!verifyAdminToken(token)) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return false;
  }
  return true;
}

function checkAdminPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(password || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = {
  createAdminToken,
  verifyAdminToken,
  getBearerToken,
  requireAdmin,
  checkAdminPassword,
};