import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    coverPhoto: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    category: {
      type: ObjectId,
      ref: "Treatments",
      required: true,
    },
    editorData: {
      type: Object, // Quill's delta format or HTML content
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BlogPost", BlogSchema);
