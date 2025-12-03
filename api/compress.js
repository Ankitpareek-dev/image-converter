const sharp = require("sharp");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const contentType = req.headers["content-type"] || "";
  const boundary = contentType.split("boundary=")[1];

  if (!boundary) {
    return res.status(400).send("Invalid multipart request");
  }

  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  const body = Buffer.concat(buffers);

  const parts = body.toString().split("--" + boundary);

  const imagePart = parts.find((p) => p.includes('name="image";'));
  const targetPart = parts.find((p) => p.includes('name="targetKb"'));

  if (!imagePart) return res.status(400).send("Image file missing");
  if (!targetPart) return res.status(400).send("targetKb missing");

  const targetKb = parseInt(
    targetPart.split("\r\n\r\n")[1].split("\r\n")[0],
    10
  );
  const targetBytes = targetKb * 1024;

  const fileStart = imagePart.indexOf("\r\n\r\n") + 4;
  const fileEnd = imagePart.lastIndexOf("\r\n");
  const fileBuffer = Buffer.from(imagePart.slice(fileStart, fileEnd), "binary");

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
  res.end(compressed);
};
