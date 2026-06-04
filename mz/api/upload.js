// OPTIONAL — image upload. Your builder.js calls POST /api/upload when someone
// uses an "Upload" button; if this endpoint isn't available it falls back to
// embedding the image directly in the content, so this is purely a nice-to-have.
// Body { filename, dataUrl } (auth required) -> { url } using Vercel Blob.
// Requires Blob storage (Storage → Create → Blob) which sets BLOB_READ_WRITE_TOKEN.
const { isAuthed, readBody } = require('./_lib/auth');

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthed(req)) return res.status(401).json({ error: 'Not authorized.' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(501).json({ error: 'Blob storage not configured.' });
  }
  const { filename, dataUrl } = await readBody(req);
  if (!dataUrl || !/^data:.*;base64,/.test(dataUrl)) return res.status(400).json({ error: 'Invalid image.' });
  try {
    const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
    const buffer = Buffer.from(m[2], 'base64');
    const mod = await import('@vercel/blob');
    const safe = (filename || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = await mod.put('uploads/' + Date.now() + '-' + safe, buffer, { access: 'public', contentType: m[1] });
    res.status(200).json({ url: blob.url });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Upload failed.' });
  }
};
