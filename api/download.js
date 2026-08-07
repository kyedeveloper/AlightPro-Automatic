// --- CHROME USER AGENT ---
const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// --- HELPER FETCH SCRAPER SEDERHANA ---
async function scraperFetch(options, label = "") {
  try {
    const fetchOptions = {
      method: options.method || "GET",
      headers: options.headers || {}
    };
    if (options.data || options.body) {
      fetchOptions.body = typeof (options.data || options.body) === 'string' 
        ? (options.data || options.body) 
        : JSON.stringify(options.data || options.body);
    }
    const response = await fetch(options.url, fetchOptions);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
    return options.rawResponse ? { status: response.status, data } : data;
  } catch (err) {
    throw new Error(`Gagal pada [${label}]: ${err.message}`);
  }
}

function getCleanUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname;
  } catch (e) {
    return url;
  }
}

// --- SNAPTIK AES DECRYPTOR & CHALLENGE SOLVER ---
async function decryptSnapTikAes(id, encryptedBase64) {
  const salt = "sn4pt1k_v3r1fy2026";
  const str = salt + ":" + id;
  const encoder = new TextEncoder();
  const keyBytes = await window.crypto.subtle.digest("SHA-256", encoder.encode(str));

  const binaryString = atob(encryptedBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const iv = bytes.slice(0, 16);
  const data = bytes.slice(16);

  const cryptoKey = await window.crypto.subtle.importKey("raw", keyBytes, { name: "AES-CBC" }, false, ["decrypt"]);
  const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "AES-CBC", iv }, cryptoKey, data);
  return new TextDecoder().decode(decryptedBuffer);
}

function solveSnapTikChallenge(challenge) {
  switch (challenge.t) {
    case "b": return ((challenge.a ^ challenge.b) >> challenge.s) & 255;
    case "r": return challenge.n.reduce((m, f) => m + f, 0) * 2 + 1;
    case "c": return challenge.w.charCodeAt(challenge.i) * challenge.m;
    case "m": return ((challenge.a + challenge.b) % 100) * challenge.c;
    case "n": return challenge.a * challenge.b + challenge.b * challenge.c + challenge.c * challenge.a - challenge.a;
    default: throw new Error("Unknown challenge type: " + challenge.t);
  }
}

// --- MAIN VERCEL SERVERLESS HANDLER ---
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
    // 1. TIKTOK SCRAPER (Menggunakan SnapTik)
    // ==========================================
    if (platform === 'tiktok_video' || platform === 'tiktok_audio') {
      const cleanUrl = getCleanUrl(url).split("?")[0];
      
      const tokenRes = await scraperFetch({
        url: "https://snaptik.app/api/token",
        method: "POST",
        headers: {
          "User-Agent": CHROME_UA,
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/json",
          "Origin": "https://snaptik.app",
          "Referer": "https://snaptik.app/"
        },
        data: {},
        rawResponse: true
      }, "SnapTik Token");

      const tData = typeof tokenRes.data === "string" ? JSON.parse(tokenRes.data) : tokenRes.data;
      if (!tData || !tData.id || !tData.p) throw new Error("Gagal mengambil token SnapTik.");

      const decryptedStr = await decryptSnapTikAes(tData.id, tData.p);
      const challenge = JSON.parse(decryptedStr);
      const _e = challenge._e;
      const _h = challenge._h;
      delete challenge._e;
      delete challenge._h;
      const challengeResult = solveSnapTikChallenge(challenge);
      const xVerify = `${tData.id}:${challengeResult}:${_e}:${_h}`;

      const extractRes = await scraperFetch({
        url: `https://snaptik.app/api/extract?url=${encodeURIComponent(cleanUrl)}`,
        headers: {
          "User-Agent": CHROME_UA,
          "X-Requested-With": "XMLHttpRequest",
          "X-Verify": xVerify,
          "Origin": "https://snaptik.app",
          "Referer": "https://snaptik.app/"
        },
        rawResponse: true
      }, "SnapTik Extract");

      const exData = typeof extractRes.data === "string" ? JSON.parse(extractRes.data) : extractRes.data;
      if (!exData || !exData.success || !exData.data) throw new Error(exData?.message || "SnapTik extraction gagal.");

      const info = exData.data;
      if (platform === 'tiktok_audio') {
        downloadUrl = info.music || info.audioUrl || info.downloadUrl;
      } else {
        downloadUrl = info.hdDownloadUrl || info.downloadUrl;
        if (downloadUrl && !downloadUrl.startsWith("http")) {
          downloadUrl = "https://snaptik.app" + downloadUrl;
        }
      }
    } 
    
    // ==========================================
    // 2. YOUTUBE SCRAPER (Menggunakan ytmp3.gg / Convert1s)
    // ==========================================
    else if (platform === 'youtube_video' || platform === 'youtube_audio') {
      const isVideo = platform === 'youtube_video';
      const format = isVideo ? "mp4" : "mp3";
      const quality = isVideo ? "720p" : "";

      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
      if (!videoId) throw new Error("Invalid YouTube URL");

      const headers = {
        "Origin": "https://media.ytmp3.gg",
        "Referer": "https://media.ytmp3.gg/",
        "User-Agent": CHROME_UA,
        "Accept": "application/json, text/plain, */*"
      };

      const convRes = await scraperFetch({
        url: "https://hub.convert1s.com/api/download",
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        data: JSON.stringify({
          url,
          os: "macos",
          output: { type: isVideo ? "video" : "audio", format, quality },
          audio: { bitrate: "128k" }
        }),
        rawResponse: true
      }, "ytmp3.gg Convert");

      const conv = typeof convRes.data === "string" ? JSON.parse(convRes.data) : convRes.data;
      if (conv.error || !conv.statusUrl) throw new Error("Gagal menginisialisasi server ytmp3.");

      let attempts = 0;
      while (!downloadUrl && attempts < 30) {
        await new Promise((r) => setTimeout(r, 2000));
        const pollData = await scraperFetch({ url: conv.statusUrl, headers }, "ytmp3.gg Status");
        attempts++;
        if (pollData.status === "completed" && pollData.downloadUrl) {
          downloadUrl = pollData.downloadUrl;
          break;
        }
        if (pollData.status === "error" || pollData.status === "failed") break;
      }

      // Fallback cadangan jika ytmp3.gg gagal merespon
      if (!downloadUrl) {
        const type = isVideo ? 'ytmp4' : 'ytmp3';
        const resFallback = await fetch(`https://api.ryzendesu.vip/api/downloader/${type}?url=${encodeURIComponent(url)}`);
        const dataFallback = await resFallback.json();
        if (dataFallback && (dataFallback.url || dataFallback.data?.url)) {
          downloadUrl = dataFallback.url || dataFallback.data.url;
        }
      }
    } else {
      throw new Error('Platform tidak dikenal.');
    }

    if (!downloadUrl) throw new Error('Gagal mendapatkan tautan download.');
    return res.status(200).json({ status: true, downloadUrl });

  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
};
      
