const express = require("express");

const { requiredSignIn } = require("../middlewares/authMiddleware");

const {
  createTreatment,
  listOfTreatments,
  readTreatment,
  updateTreatment,
  deleteTreatment,
} = require("../controller/treatmentsController");

const router = express.Router();

router.post("/create_guidance", requiredSignIn, createTreatment);
router.get("/guidance_list", listOfTreatments);
router.delete("/treatment/:treatmentId", requiredSignIn, deleteTreatment);
router.get("/treatment/:treatmentId", readTreatment);
router.put("/treatment/:treatmentId", requiredSignIn, updateTreatment);

module.exports = router;
