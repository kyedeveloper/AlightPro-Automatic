<!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Auto Prem Alight</title>
      <style>
        body { font-family: sans-serif; background: #121212; color: #fff; padding: 20px; max-width: 400px; margin: auto; }
        h2 { text-align: center; color: #00ff88; }
        input, button { width: 100%; padding: 12px; margin: 8px 0; box-sizing: border-box; border-radius: 6px; border: none; }
        input { background: #222; color: #fff; border: 1px solid #444; }
        button { background: #00ff88; color: #000; font-weight: bold; cursor: pointer; }
        .box { background: #1e1e1e; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
        #log { background: #000; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #00ff00; min-height: 80px; white-space: pre-wrap; word-break: break-all; }
      </style>
    </head>
    <body>
      <h2>AUTO PREM ALIGHT</h2>
      
      <!-- Step 1: Send Email -->
      <div class="box">
        <h3>1. Kirim Link Email</h3>
        <input type="email" id="email" placeholder="Masukin Email...">
        <button onclick="sendEmail()">Kirim Email</button>
      </div>

      <!-- Step 2: Verify Link -->
      <div class="box">
        <h3>2. Verifikasi Magic Link</h3>
        <input type="text" id="magicLink" placeholder="Paste Magic Link di sini...">
        <button onclick="verifyAcc()">Verifikasi Akun</button>
      </div>

      <!-- Log Output -->
      <div class="box">
        <h3>Status Log:</h3>
        <div id="log">Siap diproses...</div>
      </div>

      <script>
        function log(msg) {
          document.getElementById('log').innerText = msg;
        }

        async function sendEmail() {
          const email = document.getElementById('email').value;
          if (!email) return alert('Isi email dulu bro!');
          
          log('[⏳] Mengirim email...');
          try {
            const res = await fetch('/api/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
            });
            const data = await res.json();
            log('[-->] Response Send:\\n' + JSON.stringify(data, null, 2));
          } catch (err) {
            log('❌ Error: ' + err.message);
          }
        }

        async function verifyAcc() {
          const email = document.getElementById('email').value;
          const magicLink = document.getElementById('magicLink').value;
          if (!email || !magicLink) return alert('Isi email & magic link dulu bro!');
          
          log('[⏳] Memproses verifikasi...');
          try {
            const res = await fetch('/api/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, magicLink })
            });
            const data = await res.json();
            log('[-->] Response Verify:\\n' + JSON.stringify(data, null, 2));
          } catch (err) {
            log('❌ Error: ' + err.message);
          }
        }
      </script>
    </body>
    </html>
  `);
});

// 2. Backend API Endpoint: Send Email
app.post('/api/send', async (req, res) => {
  const { email } = req.body;
  try {
    const sendUrl = `https://free-restapi.biz.id/api/alight-send?email=${encodeURIComponent(email)}&apikey=`;
    const response = await fetch(sendUrl);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// 3. Backend API Endpoint: Verify Link
app.post('/api/verify', async (req, res) => {
  const { email, magicLink } = req.body;
  try {
    const verifyUrl = `https://free-restapi.biz.id/api/alight-verify?email=${encodeURIComponent(email)}&magicLink=${encodeURIComponent(magicLink)}`;
    const response = await fetch(verifyUrl);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// Export app biar bisa dibaca sama Vercel
module.exports = app;
