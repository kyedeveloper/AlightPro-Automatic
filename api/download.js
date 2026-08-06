export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, error: 'Method not allowed' });
  }

  const { platform, url } = req.body;

  if (!url) {
    return res.status(400).json({ status: false, error: 'URL tidak boleh kosong!' });
  }

  try {
    let downloadUrl = '';

    // Logika untuk TikTok (Video & Audio)
    if (platform.startsWith('tiktok')) {
      const apiResponse = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
      const json = await apiResponse.json();
      
      if (!json || !json.data) {
        throw new Error('Gagal mengambil data dari TikTok.');
      }

      if (platform === 'tiktok_audio') {
        downloadUrl = json.data.music; // Link MP3 TikTok
      } else {
        downloadUrl = json.data.play;  // Link MP4 TikTok tanpa watermark
      }
    } 
    // Logika untuk YouTube (Video & Audio yang stabil)
    else if (platform.startsWith('youtube')) {
      // Menggunakan API downloader YouTube publik yang stabil
      const ytApiUrl = `https://apis.davidcyriltech.my.id/youtube/dl?url=${encodeURIComponent(url)}`;
      const apiResponse = await fetch(ytApiUrl);
      const json = await apiResponse.json();

      if (!json || (!json.download_url && !json.video && !json.audio)) {
        // Fallback API alternatif jika yang pertama sedang gangguan
        const altApiUrl = `https://deliriuss-api-oficial.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const altResponse = await fetch(altApiUrl);
        const altJson = await altResponse.json();
        
        if (altJson && altJson.downloadUrl) {
          downloadUrl = altJson.downloadUrl;
        } else {
          throw new Error('Gagal memproses video YouTube. Pastikan link valid.');
        }
      } else {
        if (platform === 'youtube_audio') {
          downloadUrl = json.audio || json.download_url;
        } else {
          downloadUrl = json.download_url || json.video;
        }
      }
    } else {
      return res.status(400).json({ status: false, error: 'Platform tidak dikenal!' });
    }

    if (!downloadUrl) {
      throw new Error('Link download tidak dapat ditemukan dari server.');
    }

    return res.status(200).json({
      status: true,
      downloadUrl: downloadUrl
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      error: err.message || 'Terjadi kesalahan pada server downloader.'
    });
  }
}
