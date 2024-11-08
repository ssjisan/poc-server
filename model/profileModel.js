import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    profilePhoto: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    name: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    whatsApp: {
      type: String,
      required: true,
    },
    detailsInfo: {
      type: String,
      required: true,
    },
    serialInfo: [
      {
        location: {
          type: String,
          required: true,
        },
        appointmentNumber: {
          type: String,
          required: true,
        },
        consultationDays: {
          type: [Number],
          required: true,
        },
        consultationTime: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Profile", profileSchema);
