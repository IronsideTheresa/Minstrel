// GET /api/content        -> published site JSON (public, secrets stripped)
// GET /api/content?draft=1 -> draft site JSON (requires auth; full, unstripped)
const { getPublished, getDraft } = require('./_lib/store');
const { isAuthed } = require('./_lib/auth');
const { filterPublic } = require('./_lib/filter');

module.exports = async function (req, res) {
  const wantsDraft = (req.query && (req.query.draft === '1' || req.query.draft === 1))
    || /[?&]draft=1\b/.test(req.url || '');
  try {
    if (wantsDraft) {
      if (!isAuthed(req)) return res.status(401).json({ error: 'Not authorized.' });
      const draft = await getDraft();
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      return res.status(200).json(draft); // editor needs the full, unstripped draft
    }
    const published = await getPublished();
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json(filterPublic(published));
  } catch (e) {
    return res.status(500).json({ error: 'Could not load content.' });
  }
};
