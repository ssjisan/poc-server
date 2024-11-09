import Appointment from "../model/appointmentModel.js";
import nodemailer from "nodemailer";
import Profile from "../model/profileModel.js";
import User from "../model/userModel.js"; // Import your User model

export const submitAppointment = async (req, res) => {
  try {
    const {
      doctorInfo,
      appointmentDate,
      name,
      phone,
      email,
      selectedLocation,
      message,
    } = req.body;

    // Validate required fields
    if (!doctorInfo || !appointmentDate || !name || !phone || !email) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided." });
    }

    // Retrieve the doctor's information
    const doctor = await Profile.findById(doctorInfo);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found." });
    }

    // Create a new appointment document
    const newAppointment = new Appointment({
      doctorInfo,
      appointmentDate,
      name,
      phone,
      email,
      selectedLocation,
      message,
    });

    // Save the appointment to the database
    await newAppointment.save();

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Prepare email details
    const mailOptions = {
      from: {
        name: "Pediatric Orthocare",
        address: process.env.EMAIL_USER,
      },
      to: doctor.email,
      subject: "New Appointment Request",
      html: `
        <div style="padding: 20px; background-color: #f4f6f8; font-family: Arial, sans-serif;">
          <div style="background-color: #fff; padding: 20px; border-radius: 10px;">
                  <img src="cid:logoImage" alt="Logo" style="max-width: 150px;" />

            <h2 style="color: #2979ff;">Appointment Information</h2>
            <p>Dear <strong>${doctor.name}</strong>,</p>
            <p>You have received a new appointment request from <strong>${name}</strong>. Please find the details below:</p>
            <table style="width: 100%; border: 1px solid #ddd; padding: 10px;">
              <tr>
                <td><strong>Name:</strong></td>
                <td>${name}</td>
              </tr>
              <tr>
                <td><strong>Phone:</strong></td>
                <td>${phone}</td>
              </tr>
              <tr>
                <td><strong>Email:</strong></td>
                <td>${email}</td>
              </tr>
              <tr>
                <td><strong>Location:</strong></td>
                <td>${selectedLocation || "Not specified"}</td>
              </tr>
              <tr>
                <td><strong>Message:</strong></td>
                <td style="text-align: left;">${
                  message || "No message provided"
                }</td>
              </tr>
              <tr>
                <td><strong>Date:</strong></td>
                <td style="color: #f44336; font-size: 18px;">
                  ${new Date(appointmentDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </td>
              </tr>
            </table>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: "logo.png",
          path: "https://res.cloudinary.com/dzdjgu1vc/image/upload/v1730148367/poc/logo/mjwabftsm6wnyfaegusz.png",
          cid: "logoImage",
        },
      ],
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Respond with success
    res.status(201).json({ message: "Appointment created successfully!" });
  } catch (error) {
    console.error("Error submitting appointment:", error);
    res
      .status(500)
      .json({ error: "An error occurred while submitting the appointment." });
  }
};

export const getAppointments = async (req, res) => {
  const userId = req.user._id; // Assuming user ID is available in req.user

  try {
    // Fetch the user to get the role
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const userRole = user.role; // Extract the user role

    if (userRole === 0) {
      // If user role is 0 (admin), fetch all appointments
      const allAppointments = await Appointment.find()
        .populate("doctorInfo", "name email")
        .sort({ createdAt: -1 });
      return res.status(200).json(allAppointments);
    } else if (userRole === 1) {
      // If user role is 1 (doctor), fetch the doctor profile based on the user's email
      const doctorProfile = await Profile.findOne({ email: user.email }); // Match profile by the email from logged-in user

      if (!doctorProfile) {
        return res.status(404).json({ message: "Doctor profile not found." });
      }

      // Fetch only appointments related to the logged-in doctor's profile ID
      const doctorAppointments = await Appointment.find({
        doctorInfo: doctorProfile._id, // Match doctorInfo with doctor's profile ID
      })
        .populate("doctorInfo", "name email")
        .sort({ createdAt: -1 });

      return res.status(200).json(doctorAppointments);
    } else {
      // If role is not recognized, send a forbidden response
      return res.status(403).json({ message: "Access denied." });
    }
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching appointments." });
  }
};
