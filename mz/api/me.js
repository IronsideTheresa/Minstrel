// GET /api/me -> { authed, passwordSet }  (always 200; its presence tells the
// front-end the backend exists)
const { isAuthed } = require('./_lib/auth');
module.exports = function (req, res) {
  res.status(200).json({
    authed: !!isAuthed(req),
    passwordSet: !!process.env.ADMIN_PASSWORD
  });
};
