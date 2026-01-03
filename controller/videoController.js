const { v2: cloudinary } = require("cloudinary");
const dotenv = require("dotenv");
const Videos = require("../model/videoModel");
const slugify = require("slugify");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Helper function to upload images to Cloudinary
const uploadImageToCloudinary = async (imageBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "poc/videos" },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(imageBuffer);
  });
};

// Upload new video
const uploadNewVideo = async (req, res) => {
  try {
    const { title, url } = req.body;
    const thumbnail = req.file;

    if (!title?.trim()) return res.json({ error: "Name is required" });
    if (!url?.trim()) return res.json({ error: "Video URL is required" });

    let videoType;
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    const googleDriveRegex = /^(https?:\/\/)?(drive\.google\.com\/.*)$/;

    if (youtubeRegex.test(url)) videoType = "youtube";
    else if (googleDriveRegex.test(url)) videoType = "google-drive";
    else return res.status(400).json({ error: "Invalid video URL" });

    const slug = slugify(title, {
      lower: true,
      remove: /[&\/\\#,+()$~%.'":*?<>{}]/g,
    });
    const uploadedThumbnail = thumbnail
      ? await uploadImageToCloudinary(thumbnail.buffer)
      : null;

    const video = new Videos({
      thumbnail: uploadedThumbnail ? [uploadedThumbnail] : [],
      title,
      url,
      slug,
      videoType,
    });

    await video.save();
    res.status(201).json(video);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Get all videos
const getVideoList = async (req, res) => {
  try {
    const videos = await Videos.find().sort({ order: 1 });
    res.status(200).json(videos);
  } catch (err) {
    console.error("Error fetching videos:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get limited videos with pagination
const getLimitedVideo = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1;
    const skip = parseInt(req.query.skip) || 0;

    const videos = await Videos.find()
      .sort({ order: 1 })
      .skip(skip)
      .limit(limit);
    const totalVideos = await Videos.countDocuments();
    const hasMore = skip + limit < totalVideos;

    res.status(200).json({ videos, hasMore });
  } catch (err) {
    console.error("Error fetching limited videos:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update video sequence
const updateVideoSequence = async (req, res) => {
  try {
    const { reorderedVideos } = req.body;

    const bulkOps = reorderedVideos.map((video) => ({
      updateOne: {
        filter: { _id: video._id },
        update: { $set: { order: video.order } },
      },
    }));

    if (bulkOps.length > 0) {
      await Videos.bulkWrite(bulkOps);
    }

    res.status(200).json({ message: "Video sequence updated successfully" });
  } catch (err) {
    console.error("Error updating video sequence:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Read a single video
const readVideo = async (req, res) => {
  try {
    const { slug } = req.params;
    const video = await Videos.findOne({ slug });

    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json(video);
  } catch (err) {
    console.error("Error fetching video:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a single video
const updateVideo = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, url } = req.body;
    const newThumbnail = req.file;

    const video = await Videos.findOne({ slug });
    if (!video) return res.status(404).json({ message: "Video not found" });

    video.title = title || video.title;
    video.url = url || video.url;
    video.slug = title
      ? slugify(title, { lower: true, remove: /[&\/\\#,+()$~%.'":*?<>{}]/g })
      : video.slug;

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
    console.error("Error updating video:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete a video
const deleteVideo = async (req, res) => {
  try {
    const { slug } = req.params;
    const deletedVideo = await Videos.findOneAndDelete({ slug });

    if (!deletedVideo)
      return res.status(404).json({ message: "Video not found" });

    if (deletedVideo.thumbnail && deletedVideo.thumbnail.length > 0) {
      await cloudinary.uploader.destroy(deletedVideo.thumbnail[0].public_id);
    }

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (err) {
    console.error("Error deleting video:", err);
    res
      .status(500)
      .json({ message: "Failed to delete video. Please try again later." });
  }
};

module.exports = {
  uploadNewVideo,
  getVideoList,
  getLimitedVideo,
  updateVideoSequence,
  readVideo,
  updateVideo,
  deleteVideo,
};
