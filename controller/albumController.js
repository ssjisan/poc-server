import slugify from "slugify";
import Albums from "../model/albumModel.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const CLOUD_NAME = process.env.CLOUD_NAME;
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

// Function to upload image to Cloudinary
const uploadImageToCloudinary = async (imageBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'poc album', // Specify the folder name here
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result); // Return the full result for name and size processing
        }
      }
    );
    stream.end(imageBuffer);
  });
};

// Utility function to delete local files
const deleteLocalFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Failed to delete local file: ${filePath}`);
    } else {
      console.log(`Successfully deleted local file: ${filePath}`);
    }
  });
};

// Controller to create an album
export const uploadNewAlbum = async (req, res) => {
  try {
    const { name } = req.body;

    // Check if album name is provided
    if (!name) {
      return res.status(400).json({ message: "Album name is required" });
    }

    const images = req.files;

    // Check if any images are uploaded
    if (!images || images.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const uploadedImages = [];

    // Upload each image to Cloudinary
    for (const image of images) {
      const uploadResult = await uploadImageToCloudinary(image.buffer);

      uploadedImages.push({
        src: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        name: image.originalname, // Get original name from the uploaded file
        size: (image.size / (1024 * 1024)).toFixed(2), // Convert size to MB
      });
    }

    // Create a new album document
    const album = new Albums({
      name,
      slug: slugify(name, { lower: true }),
      images: uploadedImages,
    });

    // Save the album to the database
    await album.save();

    // Send the created album as a response
    res.status(201).json({
      message: "Album created successfully",
      album,
    });
  } catch (err) {
    console.log("Error creating album:", err);
    res.status(500).json({ message: err.message });
  }
};

// API for list of albums
export const listOfAllAlbums = async (req, res) => {
  try {
    // Fetch all albums from the database
    const albums = await Albums.find();

    // Return the list of albums as a JSON response
    res.status(200).json(albums);
  } catch (err) {
    console.error("Error fetching albums:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Controller for reading a single album
export const readAlbum = async (req, res) => {
  try {
    const { albumId } = req.params; // This is correctly pulling albumId from the route parameters.
    const album = await Albums.findById(albumId); // Use findById with albumId

    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }
    res.json(album);
  } catch (error) {
    console.error("Error fetching album:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller for Delete Album from db
export const deleteAlbum = async (req, res) => {
  try {
    const { albumId } = req.params;

    // Find the album by id
    const album = await Albums.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    // Delete images from Cloudinary
    for (const image of album.images) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (error) {
        console.error(`Error deleting image from Cloudinary: ${error.message}`);
      }
    }

    // Delete album from database
    await Albums.findByIdAndDelete(albumId);

    res
      .status(200)
      .json({ message: "Album and its images deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update album controller

export const updateAlbum = async (req, res) => {
  try {
    const { name, imagesToDelete } = req.body;
    let imagesToDeleteParsed = imagesToDelete;

    // If imagesToDelete is a string, parse it into an array
    if (typeof imagesToDeleteParsed === 'string') {
      imagesToDeleteParsed = JSON.parse(imagesToDeleteParsed);
    }

    console.log("Images to delete:", imagesToDeleteParsed);

    // List resources in Cloudinary folder for verification
    const cloudinaryFolder = 'poc album';
    const cloudinaryResources = await cloudinary.api.resources({
      type: 'upload',
      prefix: cloudinaryFolder,
    });

    console.log("Cloudinary resources in folder:", cloudinaryResources.resources.map(res => res.public_id));

    // Delete images from Cloudinary if any are provided
    if (Array.isArray(imagesToDeleteParsed) && imagesToDeleteParsed.length > 0) {
      const deletePromises = imagesToDeleteParsed.map(public_id => {
        console.log("Attempting to delete image with public_id:", public_id);

        // Check if the image exists in the Cloudinary folder
        const imageExists = cloudinaryResources.resources.some(resource => resource.public_id === public_id);

        if (!imageExists) {
          console.error(`Image with public_id ${public_id} does not exist in Cloudinary.`);
          return Promise.resolve({ result: 'not found' }); // Skip deletion if not found
        }

        return cloudinary.uploader.destroy(public_id);
      });

      const deleteResults = await Promise.all(deletePromises);
      console.log("Cloudinary delete results:", deleteResults);

      // Check if the delete results contain any failures
      deleteResults.forEach((result, index) => {
        if (result.result !== 'ok') {
          console.error(`Failed to delete image at index ${index}:`, result);
        }
      });
    } else {
      console.log("No images to delete.");
    }

    // Upload new images to Cloudinary if any files are provided
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      const files = req.files;
      console.log("Files to upload:", files);

      const uploadPromises = files.map(file => 
        cloudinary.uploader.upload(file.path, {
          folder: 'poc album',
        })
      );

      const uploadResults = await Promise.all(uploadPromises);
      uploadedImages = uploadResults.map(result => ({
        src: result.secure_url,
        public_id: result.public_id,
        name: path.basename(result.original_filename),
      }));

      console.log("Uploaded images:", uploadedImages);
    } else {
      console.log("No new images to upload.");
    }

    // Fetch the album from the database to confirm it exists
    const album = await Albums.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    console.log("Album found:", album);

    // Update the album in the database with the new image data and the album name
    const updatedAlbum = await Albums.findByIdAndUpdate(
      req.params.id, 
      {
        name,
        $push: { images: { $each: uploadedImages } },
      },
      { new: true }
    );

    if (!updatedAlbum) {
      return res.status(404).json({ error: "Album not found" });
    }

    console.log("Updated album:", updatedAlbum);
    
    // Return the updated album
    res.status(200).json(updatedAlbum);
  } catch (err) {
    console.error("Error during album update:", err);
    res.status(500).json({ error: "Failed to update album", details: err.message });
  }
};
