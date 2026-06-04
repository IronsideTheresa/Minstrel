// Content storage backed by Vercel KV (Upstash). Two keys:
//   minstrel:published  — what the public sees
//   minstrel:draft      — work in progress (editor)
// If KV isn't configured we serve content.default.json for GETs and block saves.
const KEY_PUB = 'minstrel:published';
const KEY_DRAFT = 'minstrel:draft';

let _default = null;
function defaultContent() {
  if (_default) return _default;
  // static require so Vercel's file tracing bundles the JSON with the function
  try { _default = require('../../content.default.json'); }
  catch (e) { _default = { version: 2, adventures: [] }; }
  return _default;
}
function kvConfigured() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}
async function kvClient() {
  const mod = await import('@vercel/kv');
  return mod.kv || (mod.default && mod.default.kv) || mod.default; // CJS/ESM interop safe
}
function noStore() {
  const e = new Error('Storage not configured. Add Vercel KV (Storage tab) and redeploy.');
  e.code = 'NO_STORE'; return e;
}

async function getPublished() {
  if (!kvConfigured()) return defaultContent();
  try {
    const kv = await kvClient();
    const v = await kv.get(KEY_PUB);
    if (v) return v;
    // seed published from the bundled default the first time
    const seed = defaultContent();
    try { await kv.set(KEY_PUB, seed); } catch (e) {}
    return seed;
  } catch (e) { return defaultContent(); }
}
async function getDraft() {
  if (!kvConfigured()) return defaultContent();
  try {
    const kv = await kvClient();
    const d = await kv.get(KEY_DRAFT);
    if (d) return d;
    return await getPublished(); // fall back to published if no draft yet
  } catch (e) { return defaultContent(); }
}
async function saveDraft(content) {
  if (!kvConfigured()) throw noStore();
  const kv = await kvClient();
  await kv.set(KEY_DRAFT, content);
  return true;
}
async function savePublished(content) {
  if (!kvConfigured()) throw noStore();
  const kv = await kvClient();
  await kv.set(KEY_PUB, content);
  await kv.set(KEY_DRAFT, content); // keep draft in sync with what's live
  return true;
}
module.exports = { getPublished, getDraft, saveDraft, savePublished, defaultContent, kvConfigured };
