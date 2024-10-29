import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./routers/authRoutes.js";
import albumRoutes from "./routers/albumRoutes.js";
import videoRoutes from "./routers/videoRoutes.js";
import profileRoutes from "./routers/profileRoutes.js";
import appointmentRoutes from "./routers/appointmentRoutes.js";
import treatmentsRoutes from "./routers/treatmentsRoutes.js";
import blogPostRoutes from "./routers/blogPostRoutes.js";
import journalRoutes from "./routers/journalRoutes.js";
import formRoutes from "./routers/formRoutes.js";

dotenv.config();

const app = express();

// Connect to the database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected"))
  .catch((err) => console.error(err));


// CORS configuration
const corsOptions = {
  origin: ["http://localhost:5174", "https://pediatricorthocare.com/"], // Add all allowed frontend origins here
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Enable if you're using cookies or other credentials
};


// Middlewares
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json());


// Router middleware
app.use(authRoutes);
app.use(albumRoutes);
app.use(videoRoutes);
app.use(profileRoutes);
app.use(appointmentRoutes);
app.use(treatmentsRoutes);
app.use(blogPostRoutes);
app.use(journalRoutes);
app.use(formRoutes);

const port = process.env.PORT || 8001;

app.get("/", (req, res) => {
  res.send("Hi!!! Your are getting data");
});

app.listen(port, () => {
  console.log(`This is running ${port}`);
});
