import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./routers/authRoutes.js";
import albumRoutes from "./routers/albumRoutes.js";
import videoRoutes from "./routers/videoRoutes.js";
import profileRoutes from "./routers/profileRoutes.js";
import appointmentRoutes from "./routers/appointmentRoutes.js"

dotenv.config();

const app = express();

// Connect to the database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected"))
  .catch((err) => console.error(err));

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Router middleware
app.use(authRoutes);
app.use(albumRoutes);
app.use(videoRoutes);
app.use(profileRoutes);
app.use(appointmentRoutes);

const port = process.env.PORT || 8001;

app.get("/", (req, res) => {
  res.send("Hi!!! Your are getting data");
});

app.listen(port, () => {
  console.log(`This is running ${port}`);
});