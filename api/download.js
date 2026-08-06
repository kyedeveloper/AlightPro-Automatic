module.exports = async function (req, res) {
  // Pastikan cuma nerima metode POST dari web
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, error: 'Method tidak diizinkan' });
  }

  const { platform, url } = req.body;
  if (!url) {
    return res.status(400).json({ status: false, error: 'URL wajib diisi' });
  }

  try {
    let downloadUrl = "";

    // 1. TIKTOK (VIDEO ATAU AUDIO)
    if (platform === 'tiktok_video' || platform === 'tiktok_audio') {
      const fetchUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      
      if (data.code === 0 && data.data) {
        // Kalau user milih video, ambil link 'play'. Kalau milih audio, ambil link 'music'
        downloadUrl = platform === 'tiktok_video' ? data.data.play : data.data.music;
      } else {
        throw new Error('Gagal nemuin file TikTok. Pastikan link bener/nggak private.');
      }
    } 
    
    // 2. YOUTUBE VIDEO (MP4)
    else if (platform === 'youtube_video') {
      const fetchUrl = `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      
      if (data.status && data.data && data.data.dl) {
        downloadUrl = data.data.dl;
      } else {
        throw new Error('Gagal nge-convert YouTube ke MP4. Coba link lain.');
      }
    } 
    
    // 3. YOUTUBE AUDIO (MP3)
    else if (platform === 'youtube_audio') {
      const fetchUrl = `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(url)}`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      
      if (data.status && data.data && data.data.dl) {
        downloadUrl = data.data.dl;
      } else {
        throw new Error('Gagal nge-convert YouTube ke MP3. Coba link lain.');
      }
    } 
    
    // ERROR PLATFORM GAK DIKENAL
    else {
      throw new Error('Platform nggak dikenal.');
    }

    // Kirim balik link downloadnya ke web lu
    res.status(200).json({ status: true, downloadUrl });

  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
};
