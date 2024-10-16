// profileRoutes.js
import express from "express";
import { requiredSignIn } from "../middlewares/authMiddleware.js";
import { createProfile,listAllDoctors } from "../controller/profileController.js";
import multer from "multer";

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create a new router instance
const router = express.Router();

// Route to create a new doctor profile
router.post(
  "/create-profile",
  requiredSignIn,
  upload.single("profilePhoto"),
  createProfile
);
router.get("/doctors", requiredSignIn, listAllDoctors);

export default router;
