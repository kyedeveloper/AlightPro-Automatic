module.exports = async function (req, res) {
  // Pastikan cuma nerima metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, error: 'Method tidak diizinkan' });
  }

  const { platform, url } = req.body;
  if (!url) {
    return res.status(400).json({ status: false, error: 'URL wajib diisi bro' });
  }

  try {
    let downloadUrl = "";

    // ==========================================
    // 1. TIKTOK (VIDEO / AUDIO) - TIKWM API
    // ==========================================
    if (platform === 'tiktok_video' || platform === 'tiktok_audio') {
      const fetchUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
      const response = await fetch(fetchUrl);
      const data = await response.json();
      
      if (data.code === 0 && data.data) {
        downloadUrl = platform === 'tiktok_video' ? data.data.play : data.data.music;
      } else {
        throw new Error('Gagal nemuin video TikTok. Pastikan link bener dan akun nggak di-private.');
      }
    } 
    
    // ==========================================
    // 2. YOUTUBE (MP4 / MP3) - MULTI API
    // ==========================================
    else if (platform === 'youtube_video' || platform === 'youtube_audio') {
      const isVideo = platform === 'youtube_video';
      
      try {
        // PERCOBAAN 1: Pakai API Ryzendesu
        const type1 = isVideo ? 'ytmp4' : 'ytmp3';
        const res1 = await fetch(`https://api.ryzendesu.vip/api/downloader/${type1}?url=${encodeURIComponent(url)}`);
        const data1 = await res1.json();
        
        if (data1 && data1.url) {
          downloadUrl = data1.url;
        } else if (data1 && data1.data && data1.data.url) {
          downloadUrl = data1.data.url;
        } else {
          throw new Error('API 1 Gagal');
        }
      } catch (err1) {
        
        try {
          // PERCOBAAN 2: Pakai API Agatz (Fallback)
          const type2 = isVideo ? 'ytmp4' : 'ytmp3';
          const res2 = await fetch(`https://api.agatz.xyz/api/${type2}?url=${encodeURIComponent(url)}`);
          const data2 = await res2.json();
          
          if (data2.status === 200 && data2.data && data2.data.url) {
            downloadUrl = data2.data.url;
          } else {
            throw new Error('API 2 Gagal');
          }
        } catch (err2) {
            // PERCOBAAN 3: Pakai API Vreden (Last Resort)
            const type3 = isVideo ? 'ytmp4' : 'ytmp3';
            const res3 = await fetch(`https://api.vreden.my.id/api/${type3}?url=${encodeURIComponent(url)}`);
            const data3 = await res3.json();

            if (data3.result && data3.result.download) {
                downloadUrl = data3.result.download;
            } else {
                throw new Error('Semua server YouTube lagi down coy, coba lagi 10 menit ke depan.');
            }
        }
      }
    } 
    
    else {
      throw new Error('Platform nggak dikenal.');
    }

    // Kirim balik link downloadnya ke web
    if (!downloadUrl) throw new Error('Gagal narik link, coba pakai link format standard.');
    res.status(200).json({ status: true, downloadUrl });

  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
};
                                     
