export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { pin } = req.body;

  // Atur PIN sesuai keinginan lu di sini
  if (pin === "990055") {
    return res.status(200).json({ success: true, role: "ADMINISTRATOR" });
  } else if (pin === "0000") {
    return res.status(200).json({ success: true, role: "MEMBER" });
  } else if (pin === "visitor") {
    return res.status(200).json({ success: true, role: "VISITOR" });
  } else {
    return res.status(401).json({ success: false, error: "PIN Salah! Coba periksa kembali." });
  }
}
