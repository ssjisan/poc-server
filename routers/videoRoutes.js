import express from "express";
import { requiredSignIn } from "../middlewares/authMiddleware.js";
import {
  uploadNewVideo,
  getVideoList,
  updateVideoSequence,
  deleteVideo,
  readVideo,
  updateVideo,
} from "../controller/videoController.js";
import multer from "multer";

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();
// Route to upload a new video with an optional thumbnail
router.post(
  "/upload_video",
  requiredSignIn,
  upload.single("thumbnail"), // Middleware to handle thumbnail upload
  uploadNewVideo
);

router.get("/list_videos", getVideoList);
router.post("/update-video-order", requiredSignIn, updateVideoSequence);
router.delete("/video/:slug", requiredSignIn, deleteVideo);
router.get("/video/:slug", readVideo);
router.put("/video/:slug", requiredSignIn,upload.single("thumbnail"), updateVideo);

export default router;
