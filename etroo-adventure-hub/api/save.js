// POST content (auth required) -> persists it; instantly live for the public.
const { isAuthed, readBody } = require('./_lib/auth');
const { saveContent } = require('./_lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthed(req)) return res.status(401).json({ error: 'Not authorized. Please log in again.' });
  const body = await readBody(req);
  const content = body && body.content;
  if (!content || typeof content !== 'object' || !Array.isArray(content.chapters)) {
    return res.status(400).json({ error: 'Invalid content payload.' });
  }
  try {
    await saveContent(content);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(e.code === 'NO_STORE' ? 503 : 500).json({ error: e.message || 'Save failed.' });
  }
};
