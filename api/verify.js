module.exports = async function (req, res) {
  // Pastikan cuma nerima metode POST dari web
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }

  const { email, magicLink } = req.body;
  if (!email || !magicLink) {
    return res.status(400).json({ error: 'Email dan Magic Link wajib diisi' });
  }

  try {
    const verifyUrl = `https://free-restapi.biz.id/api/alight-verify?email=${encodeURIComponent(email)}&magicLink=${encodeURIComponent(magicLink)}`;
    
    // Fetch bawaan Vercel Node.js 18+
    const response = await fetch(verifyUrl);
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
};
