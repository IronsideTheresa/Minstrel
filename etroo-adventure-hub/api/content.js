// PUBLIC: returns the currently published adventure content. No auth.
const { getContent } = require('./_lib/store');

module.exports = async (req, res) => {
  try {
    const content = await getContent();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(JSON.stringify(content));
  } catch (e) {
    res.status(500).json({ error: 'Could not load content' });
  }
};
