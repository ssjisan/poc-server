import express from "express";
const router = express.Router();
import { requiredSignIn } from "../middlewares/authMiddleware.js";
import {
  uploadNewVideo,
  getVideoList,
  updateVideoSequence
} from "../controller/videoController.js";


router.post(
  "/upload_video",
  requiredSignIn,
  uploadNewVideo
);
router.get("/list_videos", getVideoList);
router.post('/update-order', updateVideoSequence);

export default router;
