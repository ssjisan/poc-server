const express = require("express");
const { requiredSignIn } = require("../middlewares/authMiddleware");
const {
  uploadNewExerciseVideo,
  getExerciseVideoList,
  updateExerciseVideo,
  deleteExerciseVideo,
  readExerciseVideo,
  updateExerciseVideoSequence,
} = require("../controller/exerciseVideoController.js");
const multer = require("multer");

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();
// Route to upload a new video with an optional thumbnail
router.post(
  "/upload-exercise-video",
  requiredSignIn,
  upload.single("thumbnail"), // Middleware to handle thumbnail upload
  uploadNewExerciseVideo
);

router.get("/list-exercise-videos", getExerciseVideoList);
router.post(
  "/update-exercise-video-order",
  requiredSignIn,
  updateExerciseVideoSequence
);
router.delete("/exercise-video/:slug", requiredSignIn, deleteExerciseVideo);
router.get("/exercise-video/:slug", readExerciseVideo);
router.put(
  "/exercise-video/:slug",
  requiredSignIn,
  upload.single("thumbnail"),
  updateExerciseVideo
);

module.exports = router;
