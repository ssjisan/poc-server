const { v2: cloudinary } = require("cloudinary");
const slugify = require("slugify");
const BlogPost = require("../model/blogModel");
const Treatments = require("../model/treatmentsModel");
const Profile = require("../model/profileModel");
const UserModel = require("../model/userModel");
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Upload image to Cloudinary
const uploadImageToCloudinary = async (imageBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "poc/blog_covers" },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(imageBuffer);
  });
};

// Create blog post
const createBlogPost = async (req, res) => {
  try {
    const { title, categoryId, editorData } = req.body;
    const coverPhoto = req.file;

    if (!title) return res.status(400).json({ error: "Title is required" });
    if (!categoryId)
      return res.status(400).json({ error: "Category is required" });
    if (!editorData)
      return res.status(400).json({ error: "Editor content is required" });

    const slug = slugify(title, {
      lower: true,
      remove: /[&\/\\#,+()$~%.'":*?<>{}]/g,
    });

    const category = await Treatments.findById(categoryId);
    if (!category) return res.status(404).json({ error: "Invalid category" });

    const userId = req.user._id;
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const authorInfo = await Profile.findOne({ email: user.email.trim() });
    if (!authorInfo)
      return res.status(404).json({ error: "Author profile not found" });

    const authorName = authorInfo.name;
    const authorImage = authorInfo.profilePhoto[0].url;

    let uploadedImage = null;
    if (coverPhoto)
      uploadedImage = await uploadImageToCloudinary(coverPhoto.buffer);

    const blogPost = new BlogPost({
      title,
      slug,
      coverPhoto: uploadedImage ? [uploadedImage] : [],
      category: category._id,
      editorData,
      authorName,
      authorImage,
    });

    await blogPost.save();
    res.status(201).json(blogPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// List all blogs
const listAllBlogs = async (req, res) => {
  try {
    const blogs = await BlogPost.find();
    res.status(200).json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Read blog by slug
const readBlogPost = async (req, res) => {
  const { slug } = req.params;
  try {
    const blogPost = await BlogPost.findOne({ slug });
    if (!blogPost) return res.status(404).json({ message: "Blog not found" });
    res.status(200).json(blogPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete blog by ID
const deleteBlogPost = async (req, res) => {
  const { blogId } = req.params;
  try {
    const blogPost = await BlogPost.findById(blogId);
    if (!blogPost)
      return res.status(404).json({ message: "Blog post not found" });

    if (blogPost.coverPhoto && blogPost.coverPhoto.length > 0) {
      for (let image of blogPost.coverPhoto) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }

    await blogPost.deleteOne();
    res.status(200).json({ message: "Blog post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Edit blog post
const editBlogPost = async (req, res) => {
  const { slug } = req.params;
  const { title, categoryId, editorData, removeCoverImage } = req.body;
  const newCoverPhoto = req.file;

  try {
    const blogPost = await BlogPost.findOne({ slug });
    if (!blogPost)
      return res.status(404).json({ error: "Blog post not found" });

    if (categoryId) {
      const category = await Treatments.findById(categoryId);
      if (!category) return res.status(404).json({ error: "Invalid category" });
      blogPost.category = category._id;
    }

    if (title) {
      blogPost.title = title;
      blogPost.slug = slugify(title, {
        lower: true,
        remove: /[&\/\\#,+()$~%.'":*?<>{}]/g,
      });
    }

    if (editorData) blogPost.editorData = editorData;

    if (removeCoverImage && blogPost.coverPhoto.length > 0) {
      for (let image of blogPost.coverPhoto) {
        await cloudinary.uploader.destroy(image.public_id);
      }
      blogPost.coverPhoto = [];
    }

    if (newCoverPhoto) {
      if (blogPost.coverPhoto.length > 0) {
        for (let image of blogPost.coverPhoto) {
          await cloudinary.uploader.destroy(image.public_id);
        }
      }
      const uploadedImage = await uploadImageToCloudinary(newCoverPhoto.buffer);
      blogPost.coverPhoto = [uploadedImage];
    }

    await blogPost.save();
    res.status(200).json(blogPost);
  } catch (err) {
    console.error("Error editing blog post:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update blog sequence
const updateBlogsSequence = async (req, res) => {
  try {
    const { reorderedBlogs } = req.body;
    await BlogPost.deleteMany({});
    await BlogPost.insertMany(reorderedBlogs);
    res.status(200).json({ message: "Blogs sequence updated successfully" });
  } catch (err) {
    console.error("Error updating Blogs sequence:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createBlogPost,
  listAllBlogs,
  readBlogPost,
  deleteBlogPost,
  editBlogPost,
  updateBlogsSequence,
};
