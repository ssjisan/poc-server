import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const Appointment = new mongoose.Schema(
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
      required: false, // Assuming message is optional
    },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", Appointment);
