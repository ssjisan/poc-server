import express from "express";
const router = express.Router();
// import controller
import { createLink,listOfLinks,readLink,updateLink,removeLink,updateLinksSequence } from "../controller/linkController.js";

// import middleware
import { requiredSignIn } from "../middlewares/authMiddleware.js";

router.post("/add_link", requiredSignIn, createLink);
router.get("/links", listOfLinks);
router.get("/link/:linkId", requiredSignIn, readLink);
router.put("/link/:linkId", requiredSignIn, updateLink);
router.delete("/link/:linkId", removeLink);
router.post('/update-links-order', requiredSignIn, updateLinksSequence);


export default router;