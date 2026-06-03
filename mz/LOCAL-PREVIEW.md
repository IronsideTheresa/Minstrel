# Minstrel — local preview (no developer needed)

This lets you play with the builder on your own computer. Nothing here touches a
live site — edits save to your own browser only.

## Run it

1. Unzip the `minstrel` folder.
2. Open a terminal **in that folder** and run ONE of:
   - Python:  `python3 -m http.server 8000`
   - Node:    `npx serve` (then use the URL it prints)
3. In your browser go to:
   - **The builder:**  `http://localhost:8000/admin.html`
   - **The public game:**  `http://localhost:8000/index.html`

(Opening the files by double-clicking won't work — browsers block the data load.
 It must be served over `http://` like above.)

## What you can do in the builder (local review mode)

- **Build tab** — click any block in the preview (right) or the list (left) to edit it.
  Add blocks (text, image, video, button, container, FAQ, prize, chapters, social),
  reorder with ▲▼ or drag, duplicate ⧉, hide 👁, delete ✕.
- **Chapters** — open the Chapters block; add/duplicate/reorder/delete chapters,
  set each one Draft / Hidden / Scheduled / Live / Archived, schedule a release,
  manage its secret code (text, active, reveal timing), puzzle, button and reward.
- **Design tab** — page gradient (off / preset / custom) + brand colours, live.
- **Game setup tab** — adventure name, description, # chapters/codes, prize, dates,
  release mode, archive options; add or delete whole adventures.
- **Status tab** — the overview table of what's Live / Scheduled / Hidden / Draft / Archived.
- **Publish tab** — pre-publish warnings (missing dates, empty button URLs, duplicate
  codes, etc.). In local mode “Publish” saves a local preview; open `index.html` to see it.
- Top bar: **Desktop/Mobile** preview toggle, **Preview as user**, **Undo/Redo**,
  **Save draft**, **Publish**.

Your work is saved in your browser, so you can close and come back. Use
**Publish tab → Export backup** to save a `.json` you can send to Bobby or re-import.

## Handing off to Bobby for launch

This same folder becomes the live site. Bobby deploys it to Vercel, adds the admin
users, storage and (optional) GA4/GTM — see `README.md`. Once deployed, the login and
real “publish to everyone” turn on automatically; the public never sees the editor.

> Note: analytics events already fire on the public page (to `window.dataLayer`, ready
> for GA4/GTM). Still to come in the next build step: the deployed multi-user login +
> live publishing API and the shareable draft-preview link. This preview is for you to
> react to the builder UX first.
