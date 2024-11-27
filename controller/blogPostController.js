import { v2 as cloudinary } from "cloudinary";
import slugify from "slugify";
import BlogPost from "../model/blogModel.js"; // Import BlogPost model
import Treatments from "../model/treatmentsModel.js"; // Import Treatments model (categories)
import Profile from "../model/profileModel.js"; // Import Doctor Profile model
import UserModel from "../model/userModel.js"; // Import Doctor Profile model
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
      { folder: "poc/blog_covers" }, // Upload folder for blog covers
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

// Create Blog Post Controller Start Here //
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
    const slug = slugify(title, {
      lower: true,
      remove: /[&\/\\#,+()$~%.'":*?<>{}]/g,
    });

    // Check if the category exists
    const category = await Treatments.findById(categoryId);
    if (!category) return res.status(404).json({ error: "Invalid category" });

    // Fetch the logged-in user's email
    const userId = req.user._id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userEmail = user.email.trim();

    // Look for profile using email
    const authorInfo = await Profile.findOne({ email: userEmail });

    // Check if authorInfo is found
    if (!authorInfo) {
      return res.status(404).json({ error: "Author profile not found" });
    }

    const authorName = authorInfo.name;
    const authorImage = authorInfo.profilePhoto[0].url;

    // Upload cover photo to Cloudinary if provided
    let uploadedImage = null;
    if (coverPhoto) {
      uploadedImage = await uploadImageToCloudinary(coverPhoto.buffer);
    }

    // Create the blog post
    const blogPost = new BlogPost({
      title,
      slug,
      coverPhoto: uploadedImage ? [uploadedImage] : [],
      category: category._id,
      editorData,
      authorName,
      authorImage,
    });

    // Save the blog post in the database
    await blogPost.save();

    // Respond with the created blog post
    res.status(201).json(blogPost);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// List of BLogs Api start here //
export const listAllBlogs = async (req, res) => {
  try {
    const blogs = await BlogPost.find();
    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Blog Post by Slug Controller //
export const readBlogPost = async (req, res) => {
  const { slug } = req.params;
  try {
    // Find the blog post using the slug
    const blogPost = await BlogPost.findOne({ slug });

    if (!blogPost) {
      return res.status(404).json({ message: "Blog not found" });
    }
    // Return the blog post data
    res.status(200).json(blogPost);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Blog by Id start here //
export const deleteBlogPost = async (req, res) => {
  const { blogId } = req.params;

  try {
    // Find the blog post by ID
    const blogPost = await BlogPost.findById(blogId);

    // If the blog post doesn't exist, return a 404 error
    if (!blogPost) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    // If the blog post has a cover photo, delete it from Cloudinary
    if (blogPost.coverPhoto && blogPost.coverPhoto.length > 0) {
      for (let image of blogPost.coverPhoto) {
        await cloudinary.uploader.destroy(image.public_id); // Remove the image from Cloudinary
      }
    }

    // Delete the blog post from the database
    await blogPost.deleteOne();

    // Respond with a success message
    res.status(200).json({ message: "Blog post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};


export const editBlogPost = async (req, res) => {
  const { slug } = req.params; // Get the slug from request params
  const { title, categoryId, editorData, removeCoverImage } = req.body;
  const newCoverPhoto = req.file; // For cover photo upload

  try {
    // Find the blog post by slug
    const blogPost = await BlogPost.findOne({ slug }); // Use findOne to find by slug
    if (!blogPost) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    // Check if the category exists
    if (categoryId) {
      const category = await Treatments.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Invalid category" });
      }
      blogPost.category = category._id;
    }

    // Update the title and generate a new slug if the title changes
    if (title) {
      blogPost.title = title;
      blogPost.slug = slugify(title, {
        lower: true,
        remove: /[&\/\\#,+()$~%.'":*?<>{}]/g,
      });
    }

    // Update the editor data if provided
    if (editorData) {
      blogPost.editorData = editorData;
    }

    // Handle cover photo replacement or removal
    if (removeCoverImage && blogPost.coverPhoto.length > 0) {
      // If the cover image is marked for removal, delete the existing image from Cloudinary
      for (let image of blogPost.coverPhoto) {
        await cloudinary.uploader.destroy(image.public_id);
      }
      blogPost.coverPhoto = []; // Set cover photo to empty array
    }

    if (newCoverPhoto) {
      // If a new cover photo is uploaded, delete the existing image first
      if (blogPost.coverPhoto.length > 0) {
        for (let image of blogPost.coverPhoto) {
          await cloudinary.uploader.destroy(image.public_id);
        }
      }
      // Upload the new cover photo to Cloudinary
      const uploadedImage = await uploadImageToCloudinary(newCoverPhoto.buffer);
      blogPost.coverPhoto = [uploadedImage]; // Update with the new image
    }

    // Save the updated blog post in the database
    await blogPost.save();

    // Respond with the updated blog post
    res.status(200).json(blogPost);
  } catch (err) {
    console.error("Error editing blog post:", err); // Log the error for debugging
    res.status(500).json({ message: "Internal server error" });
  }
};

//  Update Sequence of Blog
export const updateBlogsSequence = async (req, res) => {
  try {
    const { reorderedBlogs } = req.body;

    // Clear the current collection
    await BlogPost.deleteMany({});

    // Insert the reordered blogs
    await BlogPost.insertMany(reorderedBlogs);

    res.status(200).json({ message: "Blogs sequence updated successfully" });
  } catch (err) {
    console.error("Error updating Blogs sequence:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};