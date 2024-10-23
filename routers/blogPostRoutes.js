// profileRoutes.js
import express from "express";
import { requiredSignIn } from "../middlewares/authMiddleware.js";
import {
  createBlogPost,
  listAllBlogs,
  readBlogPost,
  deleteBlogPost
} from "../controller/blogPostController.js";
import multer from "multer";

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create a new router instance
const router = express.Router();

// Route to create a new doctor profile
router.post(
  "/write-blog",
  requiredSignIn,
  upload.single("coverPhoto"),
  createBlogPost
);
router.get("/blogs", listAllBlogs);
router.get("/blog/:slug", readBlogPost);
router.delete("/blog/:blogId", requiredSignIn, deleteBlogPost);
// router.put("/doctor/:profileId", requiredSignIn,upload.single("profilePhoto"), updateProfile);
export default router;
