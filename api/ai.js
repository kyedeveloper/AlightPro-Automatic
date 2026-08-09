/**
 * Alight Pro Core - AI Multi-Model Gateway v3.0
 * Supported Providers: OpenAI (ChatGPT), Google Gemini, Groq (DeepSeek/Llama)
 */

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ status: false, error: 'Method tidak diizinkan.' });

  const { message, model } = req.body;
  if (!message) return res.status(400).json({ status: false, error: 'Pesan wajib diisi.' });

  try {
    let aiReply = "";
    const selectedModel = model || "chatgpt";

    // ==========================================
    // 1. OPENAI (CHATGPT API)
    // ==========================================
    if (selectedModel === "chatgpt") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("API Key OpenAI (ChatGPT) belum diset di Environment Variables Vercel.");

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // atau gpt-3.5-turbo
          messages: [{ role: "user", content: message }],
          temperature: 0.7
        })
      });
      const data = await response.json();
      aiReply = data.choices?.[0]?.message?.content || "Gagal mendapatkan respons dari ChatGPT.";
    } 
    
    // ==========================================
    // 2. GOOGLE GEMINI API
    // ==========================================
    else if (selectedModel === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key Google Gemini belum diset di Environment Variables Vercel.");

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }]
        })
      });
      const data = await response.json();
      aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Gagal mendapatkan respons dari Gemini.";
    } 
    
    // ==========================================
    // 3. GROQ / DEEPSEEK / LLAMA API (Alternatif Cepat & Gratis)
    // ==========================================
    else if (selectedModel === "deepseek" || selectedModel === "groq") {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error("API Key Groq/DeepSeek belum diset di Environment Variables Vercel.");

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // Bisa diganti model lain yang didukung Groq
          messages: [{ role: "user", content: message }]
        })
      });
      const data = await response.json();
      aiReply = data.choices?.[0]?.message?.content || "Gagal mendapatkan respons dari Groq AI.";
    } 
    else {
      throw new Error("Model AI tidak dikenal.");
    }

    return res.status(200).json({ status: true, reply: aiReply });

  } catch (err) {
    return res.status(500).json({ 
      status: false, 
      error: 'Error API AI: ' + err.message,
      fallback: "Pastikan API Key sudah didaftarkan di Vercel Project Settings -> Environment Variables."
    });
  }
};
                                
