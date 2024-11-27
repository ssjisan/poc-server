import express from "express";
const router = express.Router();
// import controller
import { uploadForm,listOfForm,readForm,updateForm,removeForm,updateFormsSequence } from "../controller/formController.js";

// import middleware
import { requiredSignIn } from "../middlewares/authMiddleware.js";

router.post("/upload_form", requiredSignIn, uploadForm);
router.get("/forms", listOfForm);
router.get("/form/:formId", requiredSignIn, readForm);
router.put("/form/:formId", requiredSignIn, updateForm);
router.delete("/form/:formId", removeForm);
router.post('/update-forms-order', requiredSignIn, updateFormsSequence);


export default router;
