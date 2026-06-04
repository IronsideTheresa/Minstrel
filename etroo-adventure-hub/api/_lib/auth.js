// Shared auth helpers. Files prefixed with _ are NOT exposed as API routes.
const crypto = require('crypto');

const COOKIE = 'etroo_admin';
const MAX_AGE = 60 * 60 * 12; // 12 hours

function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'etroo-dev-secret-change-me';
}
function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}
function makeToken() {
  const exp = Date.now() + MAX_AGE * 1000;
  return `${exp}.${sign(String(exp))}`;
}
function verifyToken(token) {
  if (!token || token.indexOf('.') < 0) return false;
  const [exp, sig] = token.split('.');
  if (sign(String(exp)) !== sig) return false;
  return Number(exp) > Date.now();
}
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('='); if (i < 0) return;
    out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function isAuthed(req) {
  return verifyToken(parseCookies(req)[COOKIE]);
}
function setSession(res) {
  const c = `${COOKIE}=${makeToken()}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`;
  res.setHeader('Set-Cookie', c);
}
function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve) => {
    let d = '';
    req.on('data', c => { d += c; if (d.length > 8e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
module.exports = { COOKIE, isAuthed, setSession, clearSession, readBody };
