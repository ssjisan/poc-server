import Appointment from "../model/appointmentModel.js";

export const submitAppointment = async (req, res) => {
  try {
    const { doctorInfo, preferredDate, name, phone, email, message } = req.body;

    // Validate required fields
    if (!doctorInfo || !preferredDate || !name || !phone || !email) {
      return res.status(400).json({ error: "All required fields must be provided." });
    }

    // Create a new appointment document
    const newAppointment = new Appointment({
      doctorInfo,
      preferredDate,
      name,
      phone,
      email,
      message,
    });

    // Save the appointment to the database
    await newAppointment.save();

    // Send the created appointment as a response
    res.status(201).json(newAppointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error submitting appointment" });
  }
};
