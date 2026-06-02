// GET -> { authed: boolean }. Used by the admin page to decide login vs editor.
const { isAuthed } = require('./_lib/auth');
module.exports = async (req, res) => {
  res.status(200).json({ authed: !!isAuthed(req), passwordSet: !!process.env.ADMIN_PASSWORD });
};
