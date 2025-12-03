// server.js
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// Multer: store file in memory
const upload = multer({ storage: multer.memoryStorage() });

// Compress endpoint
app.post("/compress", upload.single("image"), async (req, res) => {
  try {
    const targetKb = parseInt(req.body.targetKb, 10);
    if (!req.file || isNaN(targetKb) || targetKb <= 0) {
      return res.status(400).send("Image and valid target size are required.");
    }

    const targetBytes = targetKb * 1024;
    const inputBuffer = req.file.buffer;

    // Start with relatively high quality, then go down
    let quality = 90;
    let compressedBuffer = inputBuffer;

    // We’ll convert everything to JPEG for better compression.
    // (You can tweak this if you want to keep PNG/WebP etc.)
    while (quality >= 30) {
      compressedBuffer = await sharp(inputBuffer)
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();

      if (compressedBuffer.length <= targetBytes) {
        break;
      }

      quality -= 10; // step down quality
    }

    // If still larger than target, we just send the best we got.
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="compressed.jpg"'
    );
    return res.send(compressedBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error while compressing image.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
