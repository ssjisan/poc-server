import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const Appointment = new mongoose.Schema(
  {
    doctorInfo: {
      type: ObjectId,
      ref: "Profile",
      required: true,
    },
    preferredDate: {
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
    message: {
      type: String,
      required: false, // Assuming message is optional
    },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", Appointment);
