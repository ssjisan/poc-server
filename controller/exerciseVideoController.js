const { v2: cloudinary } = require("cloudinary");
const dotenv = require("dotenv");
const ExerciseVideos = require("../model/exerciseVideoModel");
const slugify = require("slugify");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Upload thumbnail to Cloudinary
const uploadImageToCloudinary = async (imageBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "poc/exercise_video" },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(imageBuffer);
  });
};

// Create a new exercise video
const uploadNewExerciseVideo = async (req, res) => {
  try {
    const { title, url } = req.body;
    const thumbnail = req.file;

    if (!title || !title.trim()) return res.json({ error: "Name is required" });
    if (!url || !url.trim())
      return res.json({ error: "Video URL is required" });

    // Upload thumbnail
    let uploadedThumbnail = null;
    if (thumbnail)
      uploadedThumbnail = await uploadImageToCloudinary(thumbnail.buffer);

    // Determine video type
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    const googleDriveRegex = /^(https?:\/\/)?(drive\.google\.com\/.*)$/;
    let videoType;

    if (youtubeRegex.test(url)) videoType = "youtube";
    else if (googleDriveRegex.test(url)) videoType = "google-drive";
    else return res.status(400).json({ error: "Invalid video URL" });

    const exerciseVideo = new ExerciseVideos({
      thumbnail: uploadedThumbnail ? [uploadedThumbnail] : [],
      title,
      url,
      slug: slugify(title, { lower: true }),
      videoType,
    });

    await exerciseVideo.save();
    res.status(201).json(exerciseVideo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Get all exercise videos
const getExerciseVideoList = async (req, res) => {
  try {
    const videos = await ExerciseVideos.find().sort({ order: 1 });
    res.status(200).json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update exercise video sequence
const updateExerciseVideoSequence = async (req, res) => {
  try {
    const { reorderedVideos } = req.body;

    const bulkOps = reorderedVideos.map((video) => ({
      updateOne: {
        filter: { _id: video._id },
        update: { $set: { order: video.order } },
      },
    }));

    if (bulkOps.length > 0) {
      await ExerciseVideos.bulkWrite(bulkOps);
    }

    res.status(200).json({ message: "Video sequence updated successfully" });
  } catch (err) {
    console.error("Error updating video sequence:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete an exercise video
const deleteExerciseVideo = async (req, res) => {
  try {
    const { slug } = req.params;
    const video = await ExerciseVideos.findOneAndDelete({ slug });
    if (!video) return res.status(404).json({ message: "Video not found" });

    if (video.thumbnail && video.thumbnail.length > 0) {
      try {
        await cloudinary.uploader.destroy(video.thumbnail[0].public_id);
      } catch (err) {
        console.error(err);
      }
    }

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to delete video. Please try again later." });
  }
};

// Read single exercise video
const readExerciseVideo = async (req, res) => {
  try {
    const { slug } = req.params;
    const video = await ExerciseVideos.findOne({ slug });
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json(video);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a single exercise video
const updateExerciseVideo = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, url } = req.body;
    const newThumbnail = req.file;

    const video = await ExerciseVideos.findOne({ slug });
    if (!video) return res.status(404).json({ message: "Video not found" });

    video.title = title || video.title;
    video.url = url || video.url;
    video.slug = title ? slugify(title, { lower: true }) : video.slug;

    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    const googleDriveRegex = /^(https?:\/\/)?(drive\.google\.com\/.*)$/;

    if (youtubeRegex.test(url)) video.videoType = "youtube";
    else if (googleDriveRegex.test(url)) video.videoType = "google-drive";
    else return res.status(400).json({ error: "Invalid video URL" });

    if (newThumbnail) {
      if (video.thumbnail && video.thumbnail.length > 0) {
        await cloudinary.uploader.destroy(video.thumbnail[0].public_id);
      }
      const uploadedThumbnail = await uploadImageToCloudinary(
        newThumbnail.buffer
      );
      video.thumbnail = [uploadedThumbnail];
    }

    await video.save();
    res.status(200).json(video);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  uploadNewExerciseVideo,
  getExerciseVideoList,
  updateExerciseVideoSequence,
  deleteExerciseVideo,
  readExerciseVideo,
  updateExerciseVideo,
};
