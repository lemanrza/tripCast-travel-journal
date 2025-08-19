const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig.js");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

// All upload endpoints require auth
router.use(authenticateToken);

/* ----------------------------- IMAGE UPLOADS ----------------------------- */

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "travel-lists",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 1200, height: 800, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
    resource_type: "image",
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
  },
});

router.post("/image", imageUpload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided", success: false });
    }
    res.status(200).json({
      message: "Image uploaded successfully",
      success: true,
      data: { url: req.file.path, public_id: req.file.filename },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Failed to upload image", success: false, error: error.message });
  }
});

router.post("/images", imageUpload.array("images", 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No image files provided", success: false });
    }
    const uploadedImages = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
    res.status(200).json({
      message: "Images uploaded successfully",
      success: true,
      data: uploadedImages,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Failed to upload images", success: false, error: error.message });
  }
});

router.delete("/image", async (req, res) => {
  try {
    const public_id = req.query.public_id;
    if (!public_id) return res.status(400).json({ message: "public_id is required", success: false });

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: "image",
      invalidate: true,
    });

    if (result.result === "ok" || result.result === "not found") {
      return res.status(200).json({ message: "Image deleted (or already gone)", success: true, result });
    }
    return res.status(500).json({ message: "Cloudinary did not confirm deletion", success: false, result });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Failed to delete image", success: false, error: error.message });
  }
});

/* ------------------------------ VOICE UPLOAD ----------------------------- */
/**
 * Cloudinary stores most audio under resource_type "video".
 * We’ll accept webm/ogg/mp3/m4a/wav (and also "video/webm" from some browsers).
 */

const voiceStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "travel-voices",
    resource_type: "video", // IMPORTANT for audio/webm/ogg/mp3/m4a/wav
    allowed_formats: ["webm", "ogg", "mp3", "m4a", "wav"],
    // no transformations for audio
  },
});

const voiceUpload = multer({
  storage: voiceStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_, file, cb) => {
    const isAudio = file.mimetype.startsWith("audio/");
    const isWebm = file.mimetype === "video/webm"; // many browsers label audio webm as video/webm
    if (isAudio || isWebm) cb(null, true);
    else cb(new Error("Only audio files are allowed!"), false);
  },
});

// Single voice file -> field name "file"
router.post("/voice", voiceUpload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No voice file provided", success: false });

    // Cloudinary returns file.path (URL) and file.filename (public_id)
    res.status(200).json({
      message: "Voice uploaded successfully",
      success: true,
      data: { url: req.file.path, public_id: req.file.filename },
    });
  } catch (error) {
    console.error("[upload:voice] error", error);
    res.status(500).json({ message: "Failed to upload voice", success: false, error: error.message });
  }
});

// Optional: delete voice by public_id
router.delete("/voice", async (req, res) => {
  try {
    const public_id = req.query.public_id;
    if (!public_id) return res.status(400).json({ message: "public_id is required", success: false });

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: "video", // IMPORTANT for audio deletion
      invalidate: true,
    });

    if (result.result === "ok" || result.result === "not found") {
      return res.status(200).json({ message: "Voice deleted (or already gone)", success: true, result });
    }
    return res.status(500).json({ message: "Cloudinary did not confirm deletion", success: false, result });
  } catch (error) {
    console.error("Delete voice error:", error);
    res.status(500).json({ message: "Failed to delete voice", success: false, error: error.message });
  }
});

module.exports = router;
