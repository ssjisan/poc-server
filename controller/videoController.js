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

    // Create new video entry
    const newVideo = new Videos({
      title,
      url,
      slug: slugify(title, { lower: true }),
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

// Controller for Delete video

export const deleteVideo = async (req, res) => {
  try {
    // Extract slug from the request parameters (assuming it's passed in the URL)
    const { slug } = req.params;

    // Find the video by the slug and remove it from the database
    const deletedVideo = await Videos.findOneAndDelete({ slug });

    // If no video is found with the given slug
    if (!deletedVideo) {
      return res.status(404).json({ message: "Video not found" });
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
export const readVideo = async (req, res) => {
  try {
    const { slug } = req.params; // This is correctly pulling albumId from the route parameters.
    const video = await Videos.findOne({ slug }); // Use findById with albumId

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    res.json(video);
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller for Updating a single video

export const updateVideo = async (req, res) => {
  try {
    const { slug } = req.params; // Extract slug from the request parameters
    const { title, url } = req.body; // Destructure title and url from request body

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

    // Find the video by slug
    const existingVideo = await Videos.findOne({ slug });

    if (!existingVideo) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Update the video details
    existingVideo.title = title;
    existingVideo.url = url;
    existingVideo.slug = slugify(title, { lower: true }); // Update slug based on new title

    // Save the updated video to the database
    await existingVideo.save();

    // Respond with success message and updated video data
    res.status(200).json({
      success: true,
      message: "Video updated successfully",
      video: existingVideo,
    });
  } catch (error) {
    console.error("Error updating video: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to update video. Please try again later.",
    });
  }
};