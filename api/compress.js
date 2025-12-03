const sharp = require("sharp");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed." });
  }

  const targetKb = parseInt(req.query.targetKb || req.body.targetKb);
  if (!targetKb) return res.status(400).send("Missing targetKb");

  // Read file data
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);

  const targetBytes = targetKb * 1024;

  let quality = 90;
  let compressed = buffer;

  while (quality >= 30) {
    compressed = await sharp(buffer)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    if (compressed.length <= targetBytes) break;
    quality -= 10;
  }

  res.setHeader("Content-Type", "image/jpeg");
  res.send(compressed);
};
