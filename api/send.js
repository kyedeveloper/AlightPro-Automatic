module.exports = async function (req, res) {
  // Pastikan cuma nerima metode POST dari web
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email wajib diisi' });
  }

  try {
    const sendUrl = `https://free-restapi.biz.id/api/alight-send?email=${encodeURIComponent(email)}&apikey=`;
    
    // Fetch bawaan Vercel Node.js 18+
    const response = await fetch(sendUrl);
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
};
      
