import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./routers/authRoutes.js";
import albumRoutes from "./routers/albumRoutes.js";
import videoRoutes from "./routers/videoRoutes.js";

dotenv.config();

const app = express();

// connect database //
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DataBase connected"))
  .catch((err) => console.error(err));

// middelwares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// router middelware //
app.use(authRoutes);
app.use(albumRoutes);
app.use(videoRoutes);

const port = process.env.PORT || 8001;

app.get("/", (req, res) => {
  res.send("You are getting data");
});

app.listen(port, () => {
  console.log(`This is running ${port}`);
});
