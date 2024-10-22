import { v2 as cloudinary } from "cloudinary";
import slugify from "slugify";
import BlogPost from "../model/blogModel.js"; // Import BlogPost model
import Treatments from "../model/treatmentsModel.js"; // Import Treatments model (categories)
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Function to upload image to Cloudinary
const uploadImageToCloudinary = async (imageBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "blog_covers" }, // Upload folder for blog covers
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }
    );
    stream.end(imageBuffer);
  });
};

// Create Blog Post Controller
export const createBlogPost = async (req, res) => {
  try {
    const { title, categoryId, editorData } = req.body;
    const coverPhoto = req.file; // For cover photo upload

    // Validate required fields
    if (!title) return res.status(400).json({ error: "Title is required" });
    if (!categoryId)
      return res.status(400).json({ error: "Category is required" });
    if (!editorData)
      return res.status(400).json({ error: "Editor content is required" });

    // Generate slug from title
    const slug = slugify(title, { lower: true, strict: true });

    // Check if the category exists (from Treatments model)
    const category = await Treatments.findById(categoryId);
    if (!category) return res.status(404).json({ error: "Invalid category" });

    // Upload cover photo to Cloudinary if provided
    let uploadedImage = null;
    if (coverPhoto) {
      uploadedImage = await uploadImageToCloudinary(coverPhoto.buffer);
    }

    // Create the blog post
    const blogPost = new BlogPost({
      title,
      slug,
      coverPhoto: uploadedImage ? [uploadedImage] : [], // Save Cloudinary image details
      category: category._id, // Category ObjectId
      editorData, // Editor content (Quill data)
    });

    // Save the blog post in the database
    await blogPost.save();

    // Respond with the created blog post
    res.status(201).json(blogPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
