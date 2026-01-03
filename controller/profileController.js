const { v2: cloudinary } = require("cloudinary");
const dotenv = require("dotenv");
const Profile = require("../model/profileModel");

dotenv.config();

const CLOUD_NAME = process.env.CLOUD_NAME;
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

// Upload image to Cloudinary helper
const uploadImageToCloudinary = async (imageBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "poc/doctors" },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(imageBuffer);
  });
};

// Create a new doctor profile
const createProfile = async (req, res) => {
  try {
    let { name, designation, email, phone, whatsApp, detailsInfo, serialInfo } =
      req.body;
    const profilePhoto = req.file;

    if (typeof serialInfo === "string") {
      try {
        serialInfo = JSON.parse(serialInfo);
      } catch (err) {
        return res.status(400).json({ error: "Invalid format for serialInfo" });
      }
    }

    // Validation
    if (!name?.trim())
      return res.status(400).json({ error: "Name is required" });
    if (!designation?.trim())
      return res.status(400).json({ error: "Designation is required" });
    if (!email?.trim())
      return res.status(400).json({ error: "Email is required" });
    if (!phone?.trim())
      return res.status(400).json({ error: "Phone is required" });
    if (!whatsApp?.trim())
      return res.status(400).json({ error: "WhatsApp Number is required" });
    if (!detailsInfo?.trim())
      return res.status(400).json({ error: "Details info is required" });
    if (!Array.isArray(serialInfo) || serialInfo.length === 0) {
      return res.status(400).json({ error: "Serial info is required" });
    }

    for (let i = 0; i < serialInfo.length; i++) {
      const {
        location,
        appointmentNumber,
        consultationDays,
        consultationTime,
      } = serialInfo[i];
      if (!location?.trim())
        return res
          .status(400)
          .json({ error: `Location is required for entry ${i + 1}` });
      if (!appointmentNumber?.trim())
        return res
          .status(400)
          .json({ error: `Appointment Number is required for entry ${i + 1}` });
      if (!Array.isArray(consultationDays) || consultationDays.length === 0)
        return res
          .status(400)
          .json({ error: `Consultation Days are required for entry ${i + 1}` });
      if (!consultationTime?.trim())
        return res
          .status(400)
          .json({ error: `Consultation Time is required for entry ${i + 1}` });
    }

    let uploadedImage = null;
    if (profilePhoto)
      uploadedImage = await uploadImageToCloudinary(profilePhoto.buffer);

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
      serialInfo,
    });

    await profile.save();
    res.status(201).json(profile);
  } catch (err) {
    console.error("Error creating profile:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all doctors
const listAllDoctors = async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete doctor profile
const deleteProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await Profile.findByIdAndDelete(profileId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    if (profile.profilePhoto?.length) {
      const publicId = profile.profilePhoto[0].public_id;
      await cloudinary.uploader.destroy(publicId);
    }

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read single doctor profile
const readProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await Profile.findById(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update doctor profile
const updateProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    let { name, designation, email, phone, whatsApp, detailsInfo } = req.body;
    let serialInfo = req.body.serialInfo || [];
    const profilePhoto = req.file;

    // Handle flattened serialInfo structure
    if (req.body["serialInfo[0].location"]) {
      serialInfo = [];
      let i = 0;
      while (req.body[`serialInfo[${i}].location`]) {
        const location = req.body[`serialInfo[${i}].location`];
        const appointmentNumber =
          req.body[`serialInfo[${i}].appointmentNumber`];
        const consultationDays = [];
        let dayIndex = 0;
        while (req.body[`serialInfo[${i}].consultationDays[${dayIndex}]`]) {
          consultationDays.push(
            req.body[`serialInfo[${i}].consultationDays[${dayIndex}]`]
          );
          dayIndex++;
        }
        const consultationTime = req.body[`serialInfo[${i}].consultationTime`];
        serialInfo.push({
          location,
          appointmentNumber,
          consultationDays,
          consultationTime,
        });
        i++;
      }
    }

    const profile = await Profile.findById(profileId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    profile.name = name || profile.name;
    profile.designation = designation || profile.designation;
    profile.email = email || profile.email;
    profile.phone = phone || profile.phone;
    profile.whatsApp = whatsApp || profile.whatsApp;
    profile.detailsInfo = detailsInfo || profile.detailsInfo;
    profile.serialInfo = serialInfo || profile.serialInfo;

    if (profilePhoto) {
      if (profile.profilePhoto?.length) {
        const publicId = profile.profilePhoto[0].public_id;
        await cloudinary.uploader.destroy(publicId);
      }
      const uploadedImage = await uploadImageToCloudinary(profilePhoto.buffer);
      profile.profilePhoto = [uploadedImage];
    }

    await profile.save();
    res.status(200).json(profile);
  } catch (err) {
    console.error("Error updating profile:", err);
    res
      .status(500)
      .json({ message: "An error occurred while updating the profile" });
  }
};

const listAvailableDoctors = async (req, res) => {
  try {
    const profiles = await Profile.find();

    // Exclude the doctor at index 2 (adjust index if needed)
    const filteredProfiles = profiles.filter((_, index) => index !== 2);

    res.status(200).json(filteredProfiles); // Send the filtered profiles without the doctor at index 2
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createProfile,
  listAllDoctors,
  deleteProfile,
  readProfile,
  listAvailableDoctors,
  updateProfile,
};
