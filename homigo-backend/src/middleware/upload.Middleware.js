import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);

    let prefix = "file";

    if (file.fieldname === "profile_photo") {
      prefix = "profile";
    } else if (file.fieldname === "id_document") {
      prefix = "helper-doc";
    }

    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${prefix}-${uniqueName}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  const extOk = allowedExt.includes(ext);
  const mimeOk = allowedMimeTypes.includes(file.mimetype);

  if (extOk || mimeOk) {
    cb(null, true);
  } else {
    cb(new Error("Only jpg, jpeg, png, and webp images are allowed."));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});