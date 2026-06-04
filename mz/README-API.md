# Minstrel backend (`/api`)

Drop these files into your project **root**, next to `index.html`, `admin.html`,
`assets/` and `content.default.json`. No front-end changes required — your editor
already calls every endpoint here.

```
api/
  me.js          GET  /api/me            -> { authed, passwordSet }
  login.js       POST /api/login         -> sets session cookie
  logout.js      POST /api/logout        -> clears cookie
  content.js     GET  /api/content       -> published JSON (public, secrets stripped)
                 GET  /api/content?draft=1 -> draft JSON (auth required)
  save.js        POST /api/save          -> { content, publish }  (auth required)
  upload.js      POST /api/upload        -> image upload (optional, needs Blob)
  solve.js       POST /api/solve         -> optional server-side puzzle check
  _lib/auth.js   _lib/store.js   _lib/filter.js   (shared; not routes)
package.json     adds @vercel/kv (+ @vercel/blob for uploads)
vercel.json
```

> If you already have a `package.json`, just merge the two dependencies into it
> instead of overwriting.

## Setup (Vercel)

1. **Commit these files** into the same repo/project as your front-end and deploy.
2. **Environment variables** (Project → Settings → Environment Variables):
   | Name | Required | Notes |
   |------|----------|-------|
   | `ADMIN_PASSWORD` | ✅ | the editor login password |
   | `SESSION_SECRET` | recommended | any long random string; signs the cookie |
   | `ADMIN_USERNAME` | optional | if set, login must match this username too |
   | `MINSTREL_STRIP_SECRETS` | optional | `off` to disable public secret-stripping (default on) |
3. **Add storage:** Project → **Storage → Create Database → KV** (Upstash) and
   connect it. This auto-adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
4. *(Optional)* **Storage → Create → Blob** to enable hosted image uploads
   (adds `BLOB_READ_WRITE_TOKEN`). Without it, uploads fall back to embedding the
   image in the content — everything still works.
5. **Redeploy** so the env vars/storage take effect.

That's it. The public site reads from `minstrel:published`; the editor at `/admin`
logs in, edits the `minstrel:draft`, and **Publish** writes both keys (live instantly).

## Behaviour notes

- **No KV yet?** GETs serve `content.default.json` so the site still renders, and
  saving returns a clear error telling you to add KV.
- **First run:** `minstrel:published` is empty, so it's seeded from
  `content.default.json` automatically.
- **Auth:** the cookie is HttpOnly + SameSite=Lax, HMAC-signed with `SESSION_SECRET`
  (falls back to `ADMIN_PASSWORD`), ~12h expiry. `Secure` is set in production and
  omitted on localhost so `vercel dev` works.
- **Local dev:** `npm i -g vercel` then `vercel dev` (set the same env vars locally,
  e.g. in `.env.local`).

## Optional security (turned ON by default)

`/api/content` (public) strips secrets before sending to the browser:
- drops `draft`/`hidden` chapters and `hidden` adventures,
- for not-yet-live chapters, removes `puzzle.answer/correct/sequence` and `code.text`.

So **codes for scheduled chapters no longer leak early.** Set
`MINSTREL_STRIP_SECRETS=off` to disable.

**Live chapters** still ship their answers/codes to the browser (your front-end checks
answers client-side). For full protection of live chapters too, use **`/api/solve`**:
it validates an answer server-side and only then returns that chapter's code. Using it
requires a small front-end change (your engine currently checks answers in the browser),
which I did not make per your instructions. If you don't want it, delete `api/solve.js`.
```
POST /api/solve  { adventureId, chapterId, answer }  ->  { ok:true, code:"..." } | { ok:false }
```
