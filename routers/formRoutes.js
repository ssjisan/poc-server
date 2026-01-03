const express = require("express");
const router = express.Router();
const {
  uploadForm,
  listOfForm,
  readForm,
  updateForm,
  removeForm,
  updateFormsSequence,
} = require("../controller/formController.js");

// import middleware
const { requiredSignIn } = require("../middlewares/authMiddleware");

router.post("/upload_form", requiredSignIn, uploadForm);
router.get("/forms", listOfForm);
router.get("/form/:formId", requiredSignIn, readForm);
router.put("/form/:formId", requiredSignIn, updateForm);
router.delete("/form/:formId", removeForm);
router.post("/update-forms-order", requiredSignIn, updateFormsSequence);

module.exports = router;
