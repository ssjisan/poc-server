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
        folder: "poc album", // Specify the folder name here
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
    const { albumId } = req.params;
    const { name, removedImages, newImageOrder } = req.body; // Include newImageOrder
    const newImages = req.files;

    // Log the entire request body for debugging
    console.log("Request Body:", req.body);
    console.log("New Images:", newImages);

    // Find the existing album
    const album = await Albums.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    // Handle removed images
    let removedImagesArray = [];
    if (removedImages) {
      try {
        removedImagesArray =
          typeof removedImages === "string"
            ? JSON.parse(removedImages)
            : removedImages;
      } catch (error) {
        console.error("Error parsing removedImages:", error);
      }
    }

    // Remove images from the album based on the removedImagesArray
    if (removedImagesArray.length > 0) {
      for (const imageId of removedImagesArray) {
        const image = album.images.find(
          (img) => img._id.toString() === imageId
        );
        if (image) {
          try {
            // Log the image being deleted from Cloudinary
            console.log(`Deleting image from Cloudinary: ${image.public_id}`);
            await cloudinary.uploader.destroy(image.public_id);
          } catch (error) {
            console.error(
              `Error deleting image from Cloudinary: ${error.message}`
            );
          }
          // Remove the image from the album's images array
          album.images = album.images.filter(
            (img) => img._id.toString() !== imageId
          );
        }
      }
    }

    // Handle album name update
    if (name && name !== album.name) {
      album.name = name;
      album.slug = slugify(name, { lower: true });
    }

    // Handle uploading of new images
    if (newImages && newImages.length > 0) {
      for (const newImage of newImages) {
        const uploadResult = await uploadImageToCloudinary(newImage.buffer);
        album.images.push({
          src: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          name: newImage.originalname,
          size: (newImage.size / (1024 * 1024)).toFixed(2), // Convert size to MB
        });
      }
    }

    // Update the images array based on the new order
    if (newImageOrder) {
      const reorderedImages = JSON.parse(newImageOrder)
        .map((imageId) =>
          album.images.find((img) => img._id.toString() === imageId)
        )
        .filter(Boolean); // Filter out any undefined values
      album.images = reorderedImages; // Reassign the reordered images to the album
    }

    // Save the updated album
    await album.save();

    res.status(200).json({
      message: "Album updated successfully",
      album,
    });
  } catch (error) {
    console.error("Error updating album:", error);
    res.status(500).json({ message: error.message });
  }
};
