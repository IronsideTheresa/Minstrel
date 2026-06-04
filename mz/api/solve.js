// ============================================================================
// OPTIONAL — server-side puzzle validation (full code protection).
// POST /api/solve  body { adventureId, chapterId, answer }
//   -> { ok:true, code:"THE-CODE" } if the answer is correct and the chapter is live
//   -> { ok:false } otherwise
// This lets you ALSO strip live chapters' answers/codes from /api/content and
// only hand out a code once the visitor actually solves the puzzle.
//
// NOTE: turning this on for live chapters requires a small FRONT-END change
// (your engine currently checks answers in the browser). You asked me not to
// change your front-end, so this endpoint is included but unused until you wire
// it up. Safe to delete this file if you don't want it.
// ============================================================================
const { getPublished } = require('./_lib/store');
const { isLive } = require('./_lib/filter');
const { readBody } = require('./_lib/auth');

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { adventureId, chapterId, answer } = await readBody(req);
  let site;
  try { site = await getPublished(); } catch (e) { return res.status(500).json({ error: 'Could not load content.' }); }
  const adv = (site.adventures || []).find(function (a) { return a.id === adventureId; });
  const ch = adv && (adv.chapters || []).find(function (c) { return c.id === chapterId; });
  if (!ch) return res.status(404).json({ ok: false, error: 'Chapter not found.' });
  if (!isLive(ch)) return res.status(403).json({ ok: false, error: 'Chapter not released.' });

  const pz = ch.puzzle || { kind: 'none' };
  let correct = false;
  if (pz.kind === 'none') correct = true;
  else if (pz.kind === 'riddle') correct = String(answer || '').trim().toLowerCase() === String(pz.answer || '').trim().toLowerCase();
  else if (pz.kind === 'quiz') correct = Number(answer) === Number(pz.correct);
  else if (pz.kind === 'runes') {
    const a = Array.isArray(answer) ? answer : String(answer || '').trim().split(/\s+/);
    const s = pz.sequence || [];
    correct = a.length === s.length && a.every(function (x, i) { return x === s[i]; });
  }
  if (!correct) return res.status(200).json({ ok: false });
  const code = ch.code && ch.code.active !== false ? (ch.code.text || '') : '';
  return res.status(200).json({ ok: true, code: code });
};
