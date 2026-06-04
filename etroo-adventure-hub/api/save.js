// POST /api/save  body { content: <site JSON>, publish: boolean }  (auth required)
//   publish=false -> save as draft
//   publish=true  -> save as published AND draft
const { isAuthed, readBody } = require('./_lib/auth');
const { saveDraft, savePublished } = require('./_lib/store');

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthed(req)) return res.status(401).json({ error: 'Not authorized. Please log in again.' });
  const body = await readBody(req);
  const content = body && body.content;
  if (!content || typeof content !== 'object' || !Array.isArray(content.adventures)) {
    return res.status(400).json({ error: 'Invalid content payload.' });
  }
  try {
    if (body.publish) await savePublished(content);
    else await saveDraft(content);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(e.code === 'NO_STORE' ? 503 : 500).json({ error: e.message || 'Save failed.' });
  }
};
