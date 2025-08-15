const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig.js");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

router.use(authenticateToken);

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "travel-lists",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 1200, height: 800, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "auto" }
    ]
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.post("/image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image file provided",
        success: false
      });
    }

    res.status(200).json({
      message: "Image uploaded successfully",
      success: true,
      data: {
        url: req.file.path,
        public_id: req.file.filename
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Failed to upload image",
      success: false,
      error: error.message
    });
  }
});

router.post("/images", upload.array("images", 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No image files provided",
        success: false
      });
    }

    const uploadedImages = req.files.map(file => ({
      url: file.path,
      public_id: file.filename
    }));

    res.status(200).json({
      message: "Images uploaded successfully",
      success: true,
      data: uploadedImages
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Failed to upload images",
      success: false,
      error: error.message
    });
  }
});

router.delete("/image/:public_id", async (req, res) => {
  try {
    const { public_id } = req.params;
    if (!public_id) {
      return res.status(400).json({ message: "public_id is required", success: false });
    }

    // Call Cloudinary; this param is already decoded by Express.
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: "image",
      invalidate: true,
    });

    // Treat "not found" as success so the operation is idempotent
    if (result.result === "ok" || result.result === "not found") {
      return res.status(200).json({
        message: "Image deleted (or already gone)",
        success: true,
        result,
      });
    }

    return res.status(500).json({
      message: "Cloudinary did not confirm deletion",
      success: false,
      result,
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      message: "Failed to delete image",
      success: false,
      error: error.message,
    });
  }
});


module.exports = router;
