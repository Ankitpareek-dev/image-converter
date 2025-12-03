const sharp = require("sharp");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method allowed" });
  }

  const boundary = req.headers["content-type"].split("boundary=")[1];

  // Parse multipart form-data manually
  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  const data = Buffer.concat(buffers);

  const parts = data.toString().split(boundary);

  const filePart = parts.find((p) => p.includes("filename"));
  const targetPart = parts.find((p) => p.includes(`name="targetKb"`));

  const targetKb = parseInt(targetPart.split("\r\n\r\n")[1], 10);
  const fileStart = filePart.indexOf("\r\n\r\n") + 4;
  const fileEnd = filePart.lastIndexOf("\r\n");
  const fileBuffer = Buffer.from(filePart.slice(fileStart, fileEnd), "binary");

  const targetBytes = targetKb * 1024;

  let quality = 90;
  let compressed = fileBuffer;

  while (quality >= 30) {
    compressed = await sharp(fileBuffer)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    if (compressed.length <= targetBytes) break;
    quality -= 10;
  }

  res.setHeader("Content-Type", "image/jpeg");
  res.status(200).send(compressed);
};
