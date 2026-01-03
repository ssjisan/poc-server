const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");

const webMessage = require("./helper/webMessage.js");
const authRoutes = require("./routers/authRoutes");
const albumRoutes = require("./routers/albumRoutes");
const videoRoutes = require("./routers/videoRoutes");
const profileRoutes = require("./routers/profileRoutes");
const appointmentRoutes = require("./routers/appointmentRoutes");
const treatmentsRoutes = require("./routers/treatmentsRoutes");
const blogPostRoutes = require("./routers/blogPostRoutes");
const linkRoutes = require("./routers/linkRoutes");
const formRoutes = require("./routers/formRoutes");
const exerciseVideoRoutes = require("./routers/exerciseVideoRoutes");

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
app.use(exerciseVideoRoutes);
app.use(profileRoutes);
app.use(appointmentRoutes);
app.use(treatmentsRoutes);
app.use(blogPostRoutes);
app.use(linkRoutes);
app.use(formRoutes);

const port = process.env.PORT || 8101;

app.get("/", (req, res) => {
  res.send(webMessage);
});

// 🚀 Start server
app.listen(port, () => {
  console.log(`🚀 Server is running on ${port}`);
});
