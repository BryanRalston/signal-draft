const { setCors, handleOptions } = require('../../lib/cors');
const { checkAdminPassword, createAdminToken } = require('../../lib/auth');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  setCors(req, res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  if (!process.env.ADMIN_PASSWORD) {
    res.status(503).json({ success: false, message: 'Admin not configured' });
    return;
  }

  try {
    const { password } = await readBody(req);
    if (!checkAdminPassword(password)) {
      res.status(401).json({ success: false, message: 'Invalid password' });
      return;
    }
    res.status(200).json({ success: true, token: createAdminToken() });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};