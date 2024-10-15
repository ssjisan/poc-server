import Videos from "../model/videoModel.js";
import slugify from "slugify"; // Assuming you have slugify installed

// Controller for uploading a new video
export const uploadNewVideo = async (req, res) => {
  try {
    const { title, url } = req.body;

    // Validate input
    if (!title || !url) {
      return res.status(400).json({ error: "Title and URL are required" });
    }

    // Check if the video URL is a valid YouTube link
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeRegex.test(url)) {
      return res
        .status(400)
        .json({ error: "Please provide a valid YouTube link" });
    }

    // Generate slug using slugify
    const slug = slugify(title, { lower: true });

    // Create new video entry
    const newVideo = new Videos({
      title,
      url,
      slug, // Save slug generated with slugify
    });

    // Save video to the database
    await newVideo.save();

    // Respond with success
    res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      video: newVideo,
    });
  } catch (error) {
    console.error("Error uploading video: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload video. Please try again later.",
    });
  }
};

// Controller for fetching all video

export const getVideoList = async (req, res) => {
  try {
    // Fetch all albums from the database
    const videos = await Videos.find();
    // Return the list of albums as a JSON response
    res.status(200).json(videos);
  } catch (err) {
    console.error("Error fetching albums:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateVideoSequence = async (req, res) => {
  try {
    const { reorderedVideos } = req.body;

    // Clear the current collection
    await Videos.deleteMany({});

    // Insert the reordered videos
    await Videos.insertMany(reorderedVideos);

    res.status(200).json({ message: "Video sequence updated successfully" });
  } catch (err) {
    console.error("Error updating video sequence:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};