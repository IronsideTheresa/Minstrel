// ============================================================================
// OPTIONAL SECURITY (enabled by default).
// Strips secrets from the PUBLIC /api/content response so puzzle answers and
// not-yet-released codes don't ship to the browser:
//   • drops chapters whose status is "draft" or "hidden"
//   • drops adventures whose status is "hidden"
//   • for any chapter that is NOT live yet (e.g. a future "scheduled" chapter),
//     removes puzzle.answer / puzzle.correct / puzzle.sequence and code.text
// Live chapters still ship their answers (your front-end checks them in the
// browser). For FULL protection of live chapters too, wire up /api/solve and
// strip live answers as well — see api/solve.js.
//
// To DISABLE all of this, set env  MINSTREL_STRIP_SECRETS=off
// ============================================================================
function stripEnabled() {
  const v = (process.env.MINSTREL_STRIP_SECRETS || 'on').toLowerCase();
  return v !== 'off' && v !== '0' && v !== 'false';
}
function isLive(ch) {
  const s = ch && ch.status || 'live';
  if (s === 'live' || s === 'archived') return true;
  if (s === 'scheduled') return ch.unlockAt ? Date.now() >= new Date(ch.unlockAt).getTime() : false;
  return false; // draft, hidden
}
function filterPublic(site) {
  if (!stripEnabled() || !site || !Array.isArray(site.adventures)) return site;
  const out = JSON.parse(JSON.stringify(site));
  out.adventures = out.adventures
    .filter(function (a) { return a.status !== 'hidden'; })
    .map(function (a) {
      if (Array.isArray(a.chapters)) {
        a.chapters = a.chapters
          .filter(function (ch) { return ch.status !== 'draft' && ch.status !== 'hidden'; })
          .map(function (ch) {
            if (!isLive(ch)) {
              if (ch.puzzle) { delete ch.puzzle.answer; delete ch.puzzle.correct; delete ch.puzzle.sequence; }
              if (ch.code) { ch.code = Object.assign({}, ch.code, { text: '' }); }
            }
            return ch;
          });
      }
      return a;
    });
  return out;
}
module.exports = { filterPublic, isLive, stripEnabled };
