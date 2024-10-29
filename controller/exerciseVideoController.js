import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import ExerciseVideos from "../model/exerciseVideoModel.js";
import slugify from "slugify"; // Assuming you have slugify installed

dotenv.config();

const CLOUD_NAME = process.env.CLOUD_NAME;
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

const uploadImageToCloudinary = async (imageBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "poc/exercise_video", // Specify the folder name here
      },
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


export const uploadNewExerciseVideo = async (req, res) => {
  try {
    const {
      title, url
    } = req.body;
    const thumbnail = req.file;

    // Upload the profile photo to Cloudinary
    let uploadThumbnail = null;
    if (thumbnail) {
      uploadThumbnail = await uploadImageToCloudinary(thumbnail.buffer);
    }

    // Validate required fields
    switch (true) {
      case !title.trim():
        return res.json({ error: "Name is required" });
      case !url.trim():
        return res.json({ error: "Video URL is required" });
    }

// Create video type
    let videoType;
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    const googleDriveRegex = /^(https?:\/\/)?(drive\.google\.com\/.*)$/; // Basic regex for Google Drive links

    // Determine video type
    if (youtubeRegex.test(url)) {
      videoType = "youtube";
    } else if (googleDriveRegex.test(url)) {
      videoType = "google-drive";
    } else {
      return res.status(400).json({ error: "Invalid video URL" });
    }


    // Create a new member document
    const exerciseVideos = new ExerciseVideos({
      thumbnail: uploadThumbnail ? [uploadThumbnail] : [], // Store the uploaded image data
      title,
      url,
      slug: slugify(title, { lower: true }),
      videoType
    });

    // Save the member to the database
    await exerciseVideos.save();

    // Send the created member as a response
    res.status(201).json(exerciseVideos);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};


// Controller for fetching all video

export const getExerciseVideoList = async (req, res) => {
  try {
    // Fetch all albums from the database
    const exerciseVideos = await ExerciseVideos.find();
    // Return the list of albums as a JSON response
    res.status(200).json(exerciseVideos);
  } catch (err) {
    console.error("Error fetching albums:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateExerciseVideoSequence = async (req, res) => {
  try {
    const { reorderedVideos } = req.body;

    // Clear the current collection
    await ExerciseVideos.deleteMany({});

    // Insert the reordered videos
    await ExerciseVideos.insertMany(reorderedVideos);

    res.status(200).json({ message: "Video sequence updated successfully" });
  } catch (err) {
    console.error("Error updating video sequence:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Controller for Delete video

export const deleteExerciseVideo = async (req, res) => {
  try {
    // Extract slug from the request parameters (assuming it's passed in the URL)
    const { slug } = req.params;

    // Find the video by the slug and remove it from the database
    const deletedVideo = await ExerciseVideos.findOneAndDelete({ slug });

    // If no video is found with the given slug
    if (!deletedVideo) {
      return res.status(404).json({ message: "Video not found" });
    }
    if (deletedVideo.thumbnail && deletedVideo.thumbnail.length > 0) {
      try {
        const publicId = deletedVideo.thumbnail[0].public_id;
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        res.json({ message: error.message });
      }
    }
    // Respond with success message
    res.status(200).json({ message: `Video deleted successfully` });
  } catch (err) {
    console.error("Error deleting video: ", err);

    // Handle any errors
    res
      .status(500)
      .json({ message: "Failed to delete video. Please try again later." });
  }
};

// Controller for reading a single video
export const readExerciseVideo = async (req, res) => {
  try {
    const { slug } = req.params; // This is correctly pulling albumId from the route parameters.
    const exerciseVideos = await ExerciseVideos.findOne({ slug }); // Use findById with albumId

    if (!exerciseVideos) {
      return res.status(404).json({ error: "Video not found" });
    }
    res.json(exerciseVideos);
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller for Updating a single video

export const updateExerciseVideo = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, url } = req.body;
    const newThumbnail = req.file;

    // Find the existing video by ID
    const exerciseVideos = await ExerciseVideos.findOne({slug});
    if (!exerciseVideos) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Update text fields
    exerciseVideos.title = title || exerciseVideos.title;
    exerciseVideos.url = url || exerciseVideos.url;
    exerciseVideos.slug = title ? slugify(title, { lower: true }) : exerciseVideos.slug;

    // Determine the video type based on the URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    const googleDriveRegex = /^(https?:\/\/)?(drive\.google\.com\/.*)$/;

    if (youtubeRegex.test(url)) {
      exerciseVideos.videoType = "youtube";
    } else if (googleDriveRegex.test(url)) {
      exerciseVideos.videoType = "google-drive";
    } else {
      return res.status(400).json({ error: "Invalid video URL" });
    }

    // Handle thumbnail update if a new image is uploaded
    if (newThumbnail) {
      // Remove the old thumbnail from Cloudinary
      if (exerciseVideos.thumbnail && exerciseVideos.thumbnail.length > 0) {
        const publicId = exerciseVideos.thumbnail[0].public_id;
        await cloudinary.uploader.destroy(publicId);
      }

      // Upload the new thumbnail to Cloudinary
      const uploadedThumbnail = await uploadImageToCloudinary(newThumbnail.buffer);
      exerciseVideos.thumbnail = [uploadedThumbnail]; // Update thumbnail data
    }

    // Save updated video to the database
    await exerciseVideos.save();

    // Return updated video
    res.status(200).json(exerciseVideos);
  } catch (err) {
    console.error("Error updating video:", err);
    res.status(500).json({ message: err.message });
  }
};
