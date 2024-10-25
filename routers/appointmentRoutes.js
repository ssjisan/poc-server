// profileRoutes.js
import express from "express";
import { requiredSignIn } from "../middlewares/authMiddleware.js";
import {
  submitAppointment,
  getAppointments,
} from "../controller/appointmentController.js";

// Create a new router instance
const router = express.Router();

// Route to create a new doctor profile
router.post("/book_appointment", submitAppointment);
router.get("/appointments", requiredSignIn, getAppointments);

export default router;
