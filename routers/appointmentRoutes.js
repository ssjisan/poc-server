const express = require("express");

const { requiredSignIn } = require("../middlewares/authMiddleware");

const {
  submitAppointment,
  getAppointments,
} = require("../controller/appointmentController");

// Create a new router instance
const router = express.Router();

// Route to create a new appointment
router.post("/book_appointment", submitAppointment);
router.get("/appointments", requiredSignIn, getAppointments);

module.exports = router;
