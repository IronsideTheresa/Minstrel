// POST /api/login  body { username, password }
// Validates password against ADMIN_PASSWORD (and ADMIN_USERNAME if that env is set).
const { setSession, readBody } = require('./_lib/auth');

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD is not set. Add it in Vercel → Settings → Environment Variables.' });
  }
  const body = await readBody(req);
  const username = body && body.username;
  const password = body && body.password;
  const userOk = !process.env.ADMIN_USERNAME || username === process.env.ADMIN_USERNAME;
  if (typeof password !== 'string' || password !== process.env.ADMIN_PASSWORD || !userOk) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }
  setSession(req, res);
  res.status(200).json({ ok: true });
};
