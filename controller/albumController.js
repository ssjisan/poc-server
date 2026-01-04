const slugify = require("slugify");
const Albums = require("../model/albumModel.js");
const { v2: cloudinary } = require("cloudinary");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const archiver = require("archiver");
const axios = require("axios");

dotenv.config();

const CLOUD_NAME = process.env.CLOUD_NAME;
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

// Function to destory image to Cloudinary

const destroyImageFromCloudinary = (public_id) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(public_id, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};

// --------------------------------------------------------------------------------------------------------------------//
// ------------------------------------ From 10-25-2025 new function ------------------------------------------------- //
// --------------------------------------------------------------------------------------------------------------------//

// -------------------------------------------------------------------------------------------------------------------//
// ------------------------------------ Create Album Function Start ------------------------------------------------- //
// -------------------------------------------------------------------------------------------------------------------//

const createAlbum = async (req, res) => {
  try {
    const { albumName, images } = req.body;

    // Validate input
    if (!albumName) {
      return res.status(400).json({ error: "Album name is required" });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    // Generate slug for album
    const slug =
      slugify(albumName, { lower: true }) + "-" + uuidv4().slice(0, 6);

    // Find highest existing order to continue from it
    const lastAlbum = await Albums.findOne().sort({ order: -1 });
    const nextOrder = lastAlbum ? lastAlbum.order + 1 : 1;

    // Prepare images (already uploaded to Cloudinary)
    const formattedImages = images.map((img, index) => ({
      src: img.src,
      public_id: img.public_id,
      name: img.name,
      size: parseFloat(img.size),
      order: index + 1,
    }));

    // Create album
    const newAlbum = new Albums({
      name: albumName,
      slug,
      order: nextOrder,
      images: formattedImages,
    });

    await newAlbum.save();

    res.status(201).json({
      success: true,
      message: "Album created successfully",
      album: newAlbum,
    });
  } catch (error) {
    console.error("Album creation failed:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    res.status(500).json({ error: "Failed to create album" });
  }
};
// ---------------------------------------------------------------------------------------------------------------------//
// ------------------------------------ Create Album Function End ----------------------------------------------------- //
// ---------------------------------------------------------------------------------------------------------------------//

const destroyImage = async (req, res) => {
  const { public_id } = req.body;
  console.log("destroyImage From", req.body);

  if (!public_id)
    return res
      .status(400)
      .json({ success: false, message: "public_id is required" });

  try {
    const result = await destroyImageFromCloudinary(public_id);
    res.json({ success: true, result });
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
// ---------------------------------------------------------------------------------------------------------------------//
// ------------------------------------------- Downlaod a Album Function Start ---------------------------------------- //
// ---------------------------------------------------------------------------------------------------------------------//
const downloadAlbum = async (req, res) => {
  try {
    const { slug } = req.params;

    // ✅ Find album
    const album = await Albums.findOne({ slug });
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    // ✅ Prepare zip headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${album.name}.zip"`
    );
    res.setHeader("Content-Type", "application/zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    // ✅ Fetch and add each image
    for (const img of album.images) {
      const response = await axios.get(img.src, {
        responseType: "arraybuffer",
      });
      archive.append(response.data, { name: img.name });
    }

    await archive.finalize();
  } catch (error) {
    console.error("Error downloading album:", error);
    res.status(500).json({ message: "Failed to download album" });
  }
};
// --------------------------------------------------------------------------------------------------------------------//
// ------------------------------------------- Downlaod a Album Function end ----------------------------------------- //
// --------------------------------------------------------------------------------------------------------------------//

// --------------------------------------------------------------------------------------------------------------------//
// ------------------------------------------- List of album Function start ------------------------------------------ //
// --------------------------------------------------------------------------------------------------------------------//
const listOfAllAlbums = async (req, res) => {
  try {
    // Fetch all albums from the database
    const albums = await Albums.find().sort({ order: 1 });

    // Return the list of albums as a JSON response
    res.status(200).json(albums);
  } catch (err) {
    console.error("Error fetching albums:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
// --------------------------------------------------------------------------------------------------------------------//
// ------------------------------------------- List of album Function end -------------------------------------------- //
// --------------------------------------------------------------------------------------------------------------------//

// --------------------------------------------------------------------------------------------------------------------//
// ------------------------------------------- Update album order Function start  ------------------------------------ //
// --------------------------------------------------------------------------------------------------------------------//
const updateAlbumOrder = async (req, res) => {
  try {
    const { reorderedAlbums } = req.body;

    if (!Array.isArray(reorderedAlbums) || reorderedAlbums.length === 0) {
      return res.status(400).json({
        success: false,
        message: "reorderedAlbums must be a non-empty array",
      });
    }

    const ids = reorderedAlbums.map((item) =>
      typeof item === "string" ? item : item && item._id ? item._id : null
    );

    if (ids.some((id) => !id)) {
      return res.status(400).json({
        success: false,
        message: "Each item must be either an id string or an object with _id",
      });
    }

    // Build bulk update operations: set order = index + 1
    const bulkOps = ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index + 1 } },
      },
    }));

    // Perform bulkWrite
    const bulkResult = await Albums.bulkWrite(bulkOps);

    // Return the albums in the new order
    const albums = await Albums.find().sort({ order: 1 });

    return res.status(200).json({
      success: true,
      message: "Album sequence updated",
      bulkResult,
      albums,
    });
  } catch (err) {
    console.error("Error updating album sequence:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
// --------------------------------------------------------------------------------------------------------------------//
// ------------------------------------------- Update album order Function end  -------------------------------------- //
// --------------------------------------------------------------------------------------------------------------------//

// --------------------------------------------------------------------------------------------------------------------//
// ------------------------------------------- Read album data Function start  --------------------------------------- //
// --------------------------------------------------------------------------------------------------------------------//
const readAlbum = async (req, res) => {
  try {
    const { albumId } = req.params;
    const album = await Albums.findById(albumId);

    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }
    res.json(album);
  } catch (error) {
    console.error("Error fetching album:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// --------------------------------------------------------------------------------------------------------------------//
// ------------------------------------------- Read album data Function end  ----------------------------------------- //
// --------------------------------------------------------------------------------------------------------------------//

// --------------------------------------------------------------------------------------------------------------------//
// ------------------------------------------- Delete album data Function start  ------------------------------------- //
// --------------------------------------------------------------------------------------------------------------------//
const deleteAlbum = async (req, res) => {
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
// --------------------------------------------------------------------------------------------------------------------//
// ------------------------------------------- Delete album data Function end  --------------------------------------- //
// --------------------------------------------------------------------------------------------------------------------//

// --------------------------------------------------------------------------------------------------------------------//
// ------------------------------------------- Update album data Function Start  ------------------------------------- //
// --------------------------------------------------------------------------------------------------------------------//
const updateAlbum = async (req, res) => {
  try {
    const { albumName, newImages, existingImages, removedImages } = req.body;
    const { albumId } = req.params;

    const album = await Albums.findById(albumId);
    if (!album)
      return res
        .status(404)
        .json({ success: false, message: "Album not found" });

    // Remove images from DB only (already deleted from Cloudinary on frontend)
    if (removedImages && removedImages.length > 0) {
      album.images = album.images.filter(
        (img) => !removedImages.includes(img._id.toString())
      );
    }

    // Update order of existing images
    if (existingImages && existingImages.length > 0) {
      existingImages.forEach(({ _id, order }) => {
        const img = album.images.id(_id); // find the subdocument
        if (img) img.order = order; // modify directly
      });
    }

    // Add new images with correct order
    if (newImages && newImages.length > 0) {
      const lastOrder = album.images.length
        ? Math.max(...album.images.map((img) => img.order ?? 0))
        : -1;

      album.images.push(
        ...newImages.map((img, idx) => ({
          src: img.src,
          public_id: img.public_id,
          name: img.name,
          size: img.size,
          order: lastOrder + idx + 1, // increment order for each new image
        }))
      );
    }

    // Sort images by order
    album.images.sort((a, b) => a.order - b.order);

    // Update album name
    album.name = albumName;

    await album.save();
    res.json({ success: true, album });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --------------------------------------------------------------------------------------------------------------------//
// ------------------------------------------- Update album data Function end  --------------------------------------- //
// --------------------------------------------------------------------------------------------------------------------//

module.exports = {
  listOfAllAlbums,
  readAlbum,
  deleteAlbum,
  updateAlbum,
  createAlbum,
  downloadAlbum,
  updateAlbumOrder,
  destroyImage,
};
