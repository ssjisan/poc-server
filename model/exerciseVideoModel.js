import mongoose from "mongoose";

const exerciseVideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnail: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    videoType: {
      type: String,
      enum: ["youtube", "google-drive"], // Enum to restrict to the two types
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ExerciseVideos", exerciseVideoSchema);
