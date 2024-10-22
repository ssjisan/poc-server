import express from "express";
const router = express.Router();
import { requiredSignIn } from "../middlewares/authMiddleware.js";
import {
  createTreatment,
  listOfTreatments,
} from "../controller/treatmentsController.js";

router.post("/create_treatment", requiredSignIn, createTreatment);

router.get("/treatments_list", listOfTreatments);
// router.delete("/album/:albumId", requiredSignIn, deleteAlbum);
// router.get("/album/:albumId", readAlbum);
// router.put(
//   "/album/:albumId",
//   upload.array("newImages", 50),
//   requiredSignIn,
//   updateAlbum
// );
// router.post('/update-album-order', requiredSignIn, updateAlbumSequence);

export default router;
