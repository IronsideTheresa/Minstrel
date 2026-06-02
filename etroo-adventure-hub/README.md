# Ironside Adventure Hub

A reusable digital-storybook platform. Public visitors read the adventure (no edit
controls anywhere in the public page). A password-protected `/admin` editor lets your
team change copy, colours, images, chapters, scheduling and the giveaway — and
**Save & Publish** pushes it live to everyone instantly.

The first story is **The Legend of Etroo**. When a story ends you can archive it and
start a new one without touching code.

---

## What's here

```
index.html              Public storybook (no editing code)
admin.html              Password-gated editor (noindex)
assets/styles.css       Shared theme + layout
assets/engine.js        Shared renderer (storybook → HTML)
assets/admin.js         Editor UI (talks to the API)
content.default.json    Starter content (used until you publish once)
api/content.js          GET published content (public)
api/login.js me.js logout.js   Auth (server-side password + signed cookie)
api/save.js             Save content (auth required)
api/upload.js           Image upload via Vercel Blob (auth required)
api/_lib/auth.js store.js   Shared helpers (not public routes)
vercel.json package.json
```

---

## One-time setup (about 10 minutes)

### 1. Put the code in a Git repo
Create a new GitHub repo and push this folder to it (or drag-and-drop upload in GitHub).

### 2. Import into Vercel
- vercel.com → **Add New… → Project** → import the repo.
- Framework preset: **Other** (it's a static site + serverless functions). Click **Deploy**.

### 3. Set the admin password
Vercel → your project → **Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `ADMIN_PASSWORD` | the password your team will use |
| `SESSION_SECRET` | any long random string (sign-out safety) |

### 4. Add storage so edits can be saved (Vercel KV)
- Project → **Storage → Create Database → KV** (Upstash) → connect it to the project.
- This auto-adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`. No code changes needed.

### 5. (Optional) Add Blob storage for hosted image uploads
- Project → **Storage → Create → Blob** → connect. Adds `BLOB_READ_WRITE_TOKEN`.
- With Blob on, the editor's **Upload** buttons store images and use a hosted URL.
- Without Blob, uploads still work — small images embed directly (best for icons).

### 6. Redeploy
After adding env vars / storage, **Deployments → … → Redeploy** so they take effect.

Done. Public site: `https://your-project.vercel.app/`
Editor: `https://your-project.vercel.app/admin`

---

## Daily use (no code)

1. Go to `/admin`, enter the password.
2. Edit in the drawer (✎ Edit). Tabs:
   - **Story** – title, tagline, intro, hero image, weekly recap
   - **Chapters** – add/reorder/delete; per chapter set **Live now** or **Schedule**
     a date/time; toggle which elements show (artwork, story, puzzle, code, button,
     reward); upload a chapter **icon** (replaces the number); add a puzzle/riddle/quiz
     or rune game; set the secret code
   - **Giveaway** – Gleam link, rewards, prize image
   - **FAQ / Archive** – Q&A and past/upcoming adventures
   - **Design** – background, button, heading and text colours (live preview)
   - **Publish** – Save & Publish, JSON backup export/import, log out
3. Click **Save & Publish**. Changes are live for the public immediately.

Scheduled chapters show a countdown and unlock automatically — no need to log in at
release time.

---

## Starting a new adventure later
In **Archive**, move the finished story into "Completed", then in **Story** + **Chapters**
replace the content. Same framework, no redesign. (Export a JSON backup first.)

---

## Notes
- The public `index.html` contains **no editor code** — visitors can't see or use it.
- `/admin` is `noindex` and protected server-side; an unauthenticated visitor only
  ever sees a password box.
- Local dev: `npm i -g vercel` then `vercel dev` (set the same env vars locally).
