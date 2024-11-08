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
        folder: "poc/doctors", // Specify the folder name here
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

// the Cloudinary upload function

export const createProfile = async (req, res) => {
  try {
    let { name, designation, email, phone, whatsApp, detailsInfo, serialInfo } =
      req.body;
    const profilePhoto = req.file;

    // Parse serialInfo if it comes as a string
    if (typeof serialInfo === "string") {
      try {
        serialInfo = JSON.parse(serialInfo);
      } catch (err) {
        console.error("Failed to parse serialInfo:", err);
        return res.status(400).json({ error: "Invalid format for serialInfo" });
      }
    }

    console.log("Parsed serialInfo:", serialInfo);

    // Validate required fields with improved checks
    if (!name || !name.trim())
      return res.status(400).json({ error: "Name is required" });
    if (!designation || !designation.trim())
      return res.status(400).json({ error: "Designation is required" });
    if (!email || !email.trim())
      return res.status(400).json({ error: "Email is required" });
    if (!phone || !phone.trim())
      return res.status(400).json({ error: "Phone is required" });
    if (!whatsApp || !whatsApp.trim())
      return res.status(400).json({ error: "WhatsApp Number is required" });
    if (!detailsInfo || !detailsInfo.trim())
      return res
        .status(400)
        .json({ error: "Details info about doctor is required" });
    if (!Array.isArray(serialInfo) || serialInfo.length === 0) {
      return res.status(400).json({
        error: "Serial info (location, appointmentNumber, etc.) is required",
      });
    }

    // Loop through serialInfo to validate each entry
    for (let i = 0; i < serialInfo.length; i++) {
      const {
        location,
        appointmentNumber,
        consultationDays,
        consultationTime,
      } = serialInfo[i];

      if (!location || !location.trim())
        return res
          .status(400)
          .json({ error: `Location is required for entry ${i + 1}` });
      if (!appointmentNumber || !appointmentNumber.trim())
        return res
          .status(400)
          .json({ error: `Appointment Number is required for entry ${i + 1}` });
      if (!Array.isArray(consultationDays) || consultationDays.length === 0) {
        return res
          .status(400)
          .json({ error: `Consultation Days are required for entry ${i + 1}` });
      }
      if (!consultationTime || !consultationTime.trim()) {
        return res
          .status(400)
          .json({ error: `Consultation Time is required for entry ${i + 1}` });
      }
    }

    // Upload the profile photo to Cloudinary if provided
    let uploadedImage = null;
    if (profilePhoto) {
      try {
        uploadedImage = await uploadImageToCloudinary(profilePhoto.buffer);
      } catch (err) {
        console.error("Error uploading image to Cloudinary:", err);
        return res
          .status(500)
          .json({ error: "Failed to upload profile photo" });
      }
    }

    // Create a new profile document based on the validated data
    const profile = new Profile({
      profilePhoto: uploadedImage
        ? [{ url: uploadedImage.url, public_id: uploadedImage.public_id }]
        : [],
      name,
      designation,
      email,
      phone,
      whatsApp,
      detailsInfo,
      serialInfo, // Use serialInfo passed from the body
    });

    // Save the new profile document to the database
    await profile.save();

    // Respond with the created profile
    res.status(201).json(profile);
  } catch (err) {
    console.error("Error creating profile:", err);
    res.status(500).json({ message: "Internal Server Error" });
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

export const listAvailableDoctors = async (req, res) => {
  try {
    const profiles = await Profile.find();

    // Exclude the doctor at index 2 (adjust index if needed)
    const filteredProfiles = profiles.filter((_, index) => index !== 2);

    res.status(200).json(filteredProfiles); // Send the filtered profiles without the doctor at index 2
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

// Update Profile

export const updateProfile = async (req, res) => {

  try {
    const { profileId } = req.params;
    let { name, designation, email, phone, whatsApp, detailsInfo } = req.body;
    let serialInfo = req.body.serialInfo || []; // Initialize serialInfo if it's not already defined
    const profilePhoto = req.file;

    // Reconstruct serialInfo from the flattened request body
    if (req.body['serialInfo[0].location']) {
      serialInfo = [];
      let i = 0;
      // Collect serialInfo based on index
      while (req.body[`serialInfo[${i}].location`]) {
        const location = req.body[`serialInfo[${i}].location`];
        const appointmentNumber = req.body[`serialInfo[${i}].appointmentNumber`];
        const consultationDays = [];
        
        // Collect all consultationDays for this index
        let dayIndex = 0;
        while (req.body[`serialInfo[${i}].consultationDays[${dayIndex}]`]) {
          consultationDays.push(req.body[`serialInfo[${i}].consultationDays[${dayIndex}]`]);
          dayIndex++;
        }

        const consultationTime = req.body[`serialInfo[${i}].consultationTime`];

        serialInfo.push({
          location,
          appointmentNumber,
          consultationDays,
          consultationTime,
        });

        i++; // Move to the next index
      }
    }

    // Validation for required fields
    if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });
    if (!designation || !designation.trim()) return res.status(400).json({ error: "Designation is required" });
    if (!email || !email.trim()) return res.status(400).json({ error: "Email is required" });
    if (!phone || !phone.trim()) return res.status(400).json({ error: "Phone is required" });
    if (!whatsApp || !whatsApp.trim()) return res.status(400).json({ error: "WhatsApp Number is required" });
    if (!detailsInfo || !detailsInfo.trim()) return res.status(400).json({ error: "Details info about doctor is required" });
    if (!Array.isArray(serialInfo) || serialInfo.length === 0) {
      return res.status(400).json({
        error: "Serial info (location, appointmentNumber, etc.) is required",
      });
    }

    // Validate each entry in serialInfo
    for (let i = 0; i < serialInfo.length; i++) {
      const { location, appointmentNumber, consultationDays, consultationTime } = serialInfo[i];

      if (!location || !location.trim()) {
        return res.status(400).json({ error: `Location is required for entry ${i + 1}` });
      }
      if (!appointmentNumber || !appointmentNumber.trim()) {
        return res.status(400).json({ error: `Appointment Number is required for entry ${i + 1}` });
      }
      if (!Array.isArray(consultationDays) || consultationDays.length === 0) {
        return res.status(400).json({ error: `Consultation Days are required for entry ${i + 1}` });
      }
      if (!consultationTime || !consultationTime.trim()) {
        return res.status(400).json({ error: `Consultation Time is required for entry ${i + 1}` });
      }
    }

    // Find and update the profile in the database
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Update profile fields
    profile.name = name || profile.name;
    profile.designation = designation || profile.designation;
    profile.email = email || profile.email;
    profile.phone = phone || profile.phone;
    profile.whatsApp = whatsApp || profile.whatsApp;
    profile.detailsInfo = detailsInfo || profile.detailsInfo;
    profile.serialInfo = serialInfo || profile.serialInfo; // Update serial info

    // Handle profile photo update if a new image is uploaded
    if (profilePhoto) {
      // Remove old profile photo from Cloudinary (if any)
      if (profile.profilePhoto && profile.profilePhoto.length > 0) {
        const publicId = profile.profilePhoto[0].public_id;
        await cloudinary.uploader.destroy(publicId);
      }

      // Upload new profile photo to Cloudinary
      const uploadedImage = await uploadImageToCloudinary(profilePhoto.buffer);
      profile.profilePhoto = [uploadedImage]; // Update profile photo
    }

    // Save updated profile
    await profile.save();

    // Return the updated profile in response
    res.status(200).json(profile);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "An error occurred while updating the profile" });
  }
};
