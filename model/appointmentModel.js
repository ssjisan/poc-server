const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const AppointmentSchema = new mongoose.Schema(
  {
    doctorInfo: {
      type: ObjectId,
      ref: "Profile",
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    selectedLocation: {
      type: String,
      required: false,
    },
    message: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", AppointmentSchema);
