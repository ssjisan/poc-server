import mongoose from "mongoose";
const trearmentsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subTitle: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
export default mongoose.model("Treatments", trearmentsSchema);
