// POST { filename, dataUrl } (auth required) -> stores the image in Vercel Blob
// and returns { url }. If Blob isn't configured, returns 501 so the admin UI can
// fall back to embedding the image directly in the content.
const { isAuthed, readBody } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthed(req)) return res.status(401).json({ error: 'Not authorized.' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(501).json({ error: 'Blob storage not configured.' });
  }
  const { filename, dataUrl } = await readBody(req);
  if (!dataUrl || !/^data:.*;base64,/.test(dataUrl)) return res.status(400).json({ error: 'Invalid image.' });
  try {
    const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
    const contentType = m[1];
    const buffer = Buffer.from(m[2], 'base64');
    const { put } = await import('@vercel/blob');
    const safe = (filename || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = await put(`uploads/${Date.now()}-${safe}`, buffer, { access: 'public', contentType });
    res.status(200).json({ url: blob.url });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Upload failed.' });
  }
};
