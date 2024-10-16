import express from "express";
const router = express.Router();
import { requiredSignIn } from "../middlewares/authMiddleware.js";
import {
  uploadNewVideo,
  getVideoList,
  updateVideoSequence,
  deleteVideo,
  readVideo,
  updateVideo
} from "../controller/videoController.js";

router.post("/upload_video", requiredSignIn, uploadNewVideo);
router.get("/list_videos", getVideoList);
router.post("/update-video-order", requiredSignIn, updateVideoSequence);
router.delete("/video/:slug", requiredSignIn, deleteVideo);
router.get("/video/:slug", readVideo);
router.put(
  "/video/:slug",
  requiredSignIn,
  updateVideo
);
export default router;
