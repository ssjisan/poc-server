import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import Profile from "../model/profileModel.js";

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
        folder: "poc album", // Specify the folder name here
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

// Create Doctors Profile Controller

export const createProfile = async (req, res) => {
  try {
    const {
      name,
      designation,
      email,
      phone,
      whatsApp,
      detailsInfo,
      location,
      appointmentNumber,
      consultationDays,
      consultationTime,
    } = req.body;
    const profilePhoto = req.file;

    // Upload the profile photo to Cloudinary
    let uploadedImage = null;
    if (profilePhoto) {
      uploadedImage = await uploadImageToCloudinary(profilePhoto.buffer);
    }

    // Validate required fields
    switch (true) {
      case !name.trim():
        return res.json({ error: "Name is required" });
      case !designation.trim():
        return res.json({ error: "Designation is required" });
      case !email.trim():
        return res.json({ error: "Email is required" });
      case !phone.trim():
        return res.json({ error: "Phone is required" });
      case !whatsApp.trim():
        return res.json({ error: "WhatsApp Number is required" });
      case !detailsInfo.trim():
        return res.json({ error: "Details info about doctor is required" });
      case !location.trim():
        return res.json({ error: "Location is required" });
      case !appointmentNumber.trim():
        return res.json({ error: "Appointment Number is required" });
      case !Array.isArray(consultationDays) || consultationDays.length === 0:
        return res.json({ error: "Consultation Days is required" });
      case !consultationTime.trim():
        return res.json({ error: "Consultation Time is required" });
    }

    // Create a new member document
    const profile = new Profile({
      profilePhoto: uploadedImage ? [uploadedImage] : [], // Store the uploaded image data
      name,
      designation,
      email,
      phone,
      whatsApp,
      detailsInfo,
      location,
      appointmentNumber,
      consultationDays,
      consultationTime,
    });

    // Save the member to the database
    await profile.save();

    // Send the created member as a response
    res.status(201).json(profile);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// For Get all Data from DB //
export const listAllDoctors = async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// For Delete Profile //
export const deleteProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await Profile.findByIdAndDelete(profileId);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Delete profile photo from Cloudinary
    if (profile.profilePhoto && profile.profilePhoto.length > 0) {
      try {
        const publicId = profile.profilePhoto[0].public_id;
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        res.json({ message: error.message });
      }
    }
    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// For Specific Profile Read //
export const readProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(profile);
  } catch (error) {
    console.error("Error fetching album:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
