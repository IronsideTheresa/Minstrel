// POST { password } -> sets an HttpOnly session cookie if it matches ADMIN_PASSWORD.
const { setSession, readBody } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD is not set. Add it in Vercel → Settings → Environment Variables.' });
  }
  const { password } = await readBody(req);
  if (typeof password !== 'string' || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }
  setSession(res);
  res.status(200).json({ ok: true });
};
