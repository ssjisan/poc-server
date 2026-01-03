const express = require("express");
const multer = require("multer");

const { requiredSignIn } = require("../middlewares/authMiddleware");

const {
  createBlogPost,
  listAllBlogs,
  readBlogPost,
  deleteBlogPost,
  editBlogPost,
  updateBlogsSequence,
} = require("../controller/blogPostController");

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create a new router instance
const router = express.Router();

// Route to create a new blog post
router.post(
  "/write-blog",
  requiredSignIn,
  upload.single("coverPhoto"),
  createBlogPost
);

router.get("/blogs", listAllBlogs);

router.get("/blog/:slug", readBlogPost);

router.delete("/blog/:blogId", requiredSignIn, deleteBlogPost);

router.put(
  "/blog/:slug",
  requiredSignIn,
  upload.single("coverPhoto"),
  editBlogPost
);

router.post("/update-blogs-order", requiredSignIn, updateBlogsSequence);

module.exports = router;
