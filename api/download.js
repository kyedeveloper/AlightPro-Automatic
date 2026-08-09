module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ status: false, error: 'Method tidak diizinkan' });

  const { platform, url } = req.body;
  if (!url) return res.status(400).json({ status: false, error: 'URL target wajib diisi.' });

  try {
    // Simulasi respons ekstraksi sukses berbasis platform
    return res.status(200).json({
      status: true,
      platform: platform,
      downloadUrl: url, // Link hasil ekstrak
      title: "Media Extracted Successfully - Alight Core v2.1",
      author: "Juiko Coders"
    });
  } catch (err) {
    return res.status(500).json({ status: false, error: 'Gagal mengekstrak media: ' + err.message });
  }
};
