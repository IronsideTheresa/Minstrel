// POST /api/logout -> clears the session cookie
const { clearSession } = require('./_lib/auth');
module.exports = function (req, res) {
  clearSession(req, res);
  res.status(200).json({ ok: true });
};
