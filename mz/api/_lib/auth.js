// Shared auth helpers. Files prefixed with _ are NOT exposed as API routes.
const crypto = require('crypto');

const COOKIE = 'minstrel_session';
const MAX_AGE = 60 * 60 * 12; // 12 hours

function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'minstrel-dev-secret-change-me';
}
function sign(value) {
  return crypto.createHmac('sha256', secret()).update(String(value)).digest('base64url');
}
function makeToken() {
  const exp = Date.now() + MAX_AGE * 1000;
  return exp + '.' + sign(exp);
}
function verifyToken(token) {
  if (!token || token.indexOf('.') < 0) return false;
  const i = token.indexOf('.');
  const exp = token.slice(0, i), sig = token.slice(i + 1);
  if (sign(exp) !== sig) return false;
  return Number(exp) > Date.now();
}
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(function (p) {
    const i = p.indexOf('='); if (i < 0) return;
    out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function isAuthed(req) {
  return verifyToken(parseCookies(req)[COOKIE]);
}
function isLocalhost(req) {
  return /^(localhost|127\.0\.0\.1)(:|$)/.test(req.headers.host || '');
}
function setSession(req, res) {
  const secure = isLocalhost(req) ? '' : ' Secure;';
  res.setHeader('Set-Cookie',
    COOKIE + '=' + makeToken() + '; HttpOnly;' + secure + ' SameSite=Lax; Path=/; Max-Age=' + MAX_AGE);
}
function clearSession(req, res) {
  const secure = isLocalhost(req) ? '' : ' Secure;';
  res.setHeader('Set-Cookie', COOKIE + '=; HttpOnly;' + secure + ' SameSite=Lax; Path=/; Max-Age=0');
}
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return await new Promise(function (resolve) {
    let d = '';
    req.on('data', function (c) { d += c; if (d.length > 8e6) req.destroy(); });
    req.on('end', function () { try { resolve(JSON.parse(d || '{}')); } catch (e) { resolve({}); } });
    req.on('error', function () { resolve({}); });
  });
}
module.exports = { COOKIE, isAuthed, setSession, clearSession, readBody };
