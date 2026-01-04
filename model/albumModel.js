const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    images: [
      {
        src: { type: String, required: true },
        public_id: { type: String, required: true },
        name: { type: String, required: true },
        size: { type: Number, required: true },
        order: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Albums", albumSchema);
