module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, error: 'Method tidak diizinkan' });
  }

  const { platform, url } = req.body;
  if (!url) {
    return res.status(400).json({ status: false, error: 'URL wajib diisi' });
  }

  try {
    let downloadUrl = "";

    if (platform === 'tiktok') {
      // Pake API gratisan TikWM buat ngambil video tanpa watermark
      const fetchUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      
      if (data.code === 0 && data.data && data.data.play) {
        downloadUrl = data.data.play;
      } else {
        throw new Error('Gagal nemuin video TikTok. Pastikan link bener/nggak di-private.');
      }
    } 
    
    else if (platform === 'youtube') {
      // Pake API Siputzx (Public REST API populer) buat ngambil MP4 YouTube
      const fetchUrl = `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      
      if (data.status && data.data && data.data.dl) {
        downloadUrl = data.data.dl;
      } else {
        throw new Error('Gagal nge-convert YouTube. Coba pakai link video lain.');
      }
    } 
    
    else {
      throw new Error('Platform nggak dikenal.');
    }

    // Kirim balik link downloadnya ke tampilan depan (index.html)
    res.status(200).json({ status: true, downloadUrl });

  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
};
