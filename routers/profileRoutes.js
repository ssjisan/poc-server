// profileRoutes.js
import express from "express";
import { requiredSignIn } from "../middlewares/authMiddleware.js";
import {
  createProfile,
  listAllDoctors,
  deleteProfile,
  readProfile,
  updateProfile,
  listAvailableDoctors
} from "../controller/profileController.js";
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
router.get("/doctors", listAllDoctors);
router.get("/availableDoctors", listAvailableDoctors);
router.delete("/doctor/:profileId", requiredSignIn, deleteProfile);
router.get("/doctor/:profileId", requiredSignIn, readProfile);
router.put("/doctor/:profileId", requiredSignIn,upload.single("profilePhoto"), updateProfile);
export default router;
