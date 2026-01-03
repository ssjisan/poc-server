const Appointment = require("../model/appointmentModel");
const nodemailer = require("nodemailer");
const Profile = require("../model/profileModel");
const User = require("../model/userModel"); // Import your User model

const submitAppointment = async (req, res) => {
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

    if (!doctorInfo || !appointmentDate || !name || !phone || !email) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided." });
    }

    const doctor = await Profile.findById(doctorInfo);
    if (!doctor) return res.status(404).json({ error: "Doctor not found." });

    const newAppointment = new Appointment({
      doctorInfo,
      appointmentDate,
      name,
      phone,
      email,
      selectedLocation,
      message,
    });

    await newAppointment.save();

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

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
                <td><strong>Name:</strong></td><td>${name}</td>
              </tr>
              <tr>
                <td><strong>Phone:</strong></td><td>${phone}</td>
              </tr>
              <tr>
                <td><strong>Email:</strong></td><td>${email}</td>
              </tr>
              <tr>
                <td><strong>Location:</strong></td><td>${
                  selectedLocation || "Not specified"
                }</td>
              </tr>
              <tr>
                <td><strong>Message:</strong></td><td style="text-align: left;">${
                  message || "No message provided"
                }</td>
              </tr>
              <tr>
                <td><strong>Date:</strong></td><td style="color: #f44336; font-size: 18px;">${appointmentDate}</td>
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

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "Appointment created successfully!" });
  } catch (error) {
    console.error("Error submitting appointment:", error);
    res
      .status(500)
      .json({ error: "An error occurred while submitting the appointment." });
  }
};

const getAppointments = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const userRole = user.role;

    if (userRole === 0) {
      // admin
      const allAppointments = await Appointment.find()
        .populate("doctorInfo", "name email")
        .sort({ createdAt: -1 });
      return res.status(200).json(allAppointments);
    } else if (userRole === 1) {
      // doctor
      const doctorProfile = await Profile.findOne({ email: user.email });
      if (!doctorProfile)
        return res.status(404).json({ message: "Doctor profile not found." });

      const doctorAppointments = await Appointment.find({
        doctorInfo: doctorProfile._id,
      })
        .populate("doctorInfo", "name email")
        .sort({ createdAt: -1 });

      return res.status(200).json(doctorAppointments);
    } else {
      return res.status(403).json({ message: "Access denied." });
    }
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching appointments." });
  }
};

module.exports = {
  submitAppointment,
  getAppointments,
};
