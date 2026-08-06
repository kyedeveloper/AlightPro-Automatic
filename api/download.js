module.exports = async function (req, res) {
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
    // 1. TIKTOK (VIDEO / AUDIO) - MULTI API
    // ==========================================
    if (platform === 'tiktok_video' || platform === 'tiktok_audio') {
      try {
        // Percobaan 1: Pakai API Ikyyxd milik lu
        const resIkyy = await fetch(`https://api.ikyyxd.my.id/api/downloader/tiktok?url=${encodeURIComponent(url)}`);
        const dataIkyy = await resIkyy.json();
        if (dataIkyy && (dataIkyy.url || dataIkyy.downloadUrl || (dataIkyy.data && dataIkyy.data.play))) {
          downloadUrl = dataIkyy.url || dataIkyy.downloadUrl || (platform === 'tiktok_video' ? dataIkyy.data.play : dataIkyy.data.music);
        } else {
          throw new Error('API TikTok Ikyyxd Gagal');
        }
      } catch (e1) {
        // Percobaan 2: Fallback ke TikWM API
        const resTik = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const dataTik = await resTik.json();
        if (dataTik.code === 0 && dataTik.data) {
          downloadUrl = platform === 'tiktok_video' ? dataTik.data.play : dataTik.data.music;
        } else {
          throw new Error('Gagal mengambil video TikTok dari semua server.');
        }
      }
    } 
    
    // ==========================================
    // 2. YOUTUBE (MP4 / MP3) - MULTI API
    // ==========================================
    else if (platform === 'youtube_video' || platform === 'youtube_audio') {
      const isVideo = platform === 'youtube_video';
      const type = isVideo ? 'ytmp4' : 'ytmp3';

      try {
        // Percobaan 1: Pakai API Ikyyxd milik lu
        const resIkyy = await fetch(`https://api.ikyyxd.my.id/api/downloader/${type}?url=${encodeURIComponent(url)}`);
        const dataIkyy = await resIkyy.json();
        if (dataIkyy && (dataIkyy.url || dataIkyy.downloadUrl || dataIkyy.result)) {
          downloadUrl = dataIkyy.url || dataIkyy.downloadUrl || dataIkyy.result;
        } else {
          throw new Error('API YouTube Ikyyxd Gagal');
        }
      } catch (e1) {
        try {
          // Percobaan 2: Fallback ke Ryzendesu
          const res2 = await fetch(`https://api.ryzendesu.vip/api/downloader/${type}?url=${encodeURIComponent(url)}`);
          const data2 = await res2.json();
          if (data2 && (data2.url || (data2.data && data2.data.url))) {
            downloadUrl = data2.url || data2.data.url;
          } else {
            throw new Error('API Cadangan 1 Gagal');
          }
        } catch (e2) {
          // Percobaan 3: Fallback terakhir ke Vreden
          const res3 = await fetch(`https://api.vreden.my.id/api/${type}?url=${encodeURIComponent(url)}`);
          const data3 = await res3.json();
          if (data3.result && data3.result.download) {
            downloadUrl = data3.result.download;
          } else {
            throw new Error('Semua server YouTube sedang sibuk/down. Coba beberapa saat lagi.');
          }
        }
      }
    } else {
      throw new Error('Platform tidak dikenal.');
    }

    if (!downloadUrl) throw new Error('Gagal mendapatkan link download.');
    res.status(200).json({ status: true, downloadUrl });

  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
};
