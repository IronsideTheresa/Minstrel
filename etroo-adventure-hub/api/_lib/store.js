// Content storage. Uses Vercel KV when configured; otherwise falls back to the
// bundled default (read-only) so the site still renders before storage is set up.
const path = require('path');
const fs = require('fs');

const KEY = 'etroo:content';
let _default = null;

function defaultContent() {
  if (_default) return _default;
  try { _default = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content.default.json'), 'utf8')); }
  catch (e) { _default = { story: { title: 'The Legend of Etroo' }, chapters: [] }; }
  return _default;
}
function kvConfigured() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}
async function getContent() {
  if (!kvConfigured()) return defaultContent();
  try {
    const { kv } = await import('@vercel/kv');
    const data = await kv.get(KEY);
    return data || defaultContent();
  } catch (e) {
    return defaultContent();
  }
}
async function saveContent(content) {
  if (!kvConfigured()) {
    const err = new Error('Storage not configured. Add Vercel KV (Storage tab) and redeploy.');
    err.code = 'NO_STORE'; throw err;
  }
  const { kv } = await import('@vercel/kv');
  await kv.set(KEY, content);
  return true;
}
module.exports = { getContent, saveContent, defaultContent, kvConfigured };
