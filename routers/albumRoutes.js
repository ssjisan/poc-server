const express = require("express");
const multer = require("multer");

const { requiredSignIn } = require("../middlewares/authMiddleware");

const {
  uploadNewAlbum,
  listOfAllAlbums,
  deleteAlbum,
  readAlbum,
  updateAlbum,
  updateAlbumSequence,
} = require("../controller/albumController");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/upload_album",
  requiredSignIn,
  upload.array("images", 50),
  uploadNewAlbum
);

router.get("/albums", listOfAllAlbums);

router.delete("/album/:albumId", requiredSignIn, deleteAlbum);

router.get("/album/:albumId", readAlbum);

router.put(
  "/album/:albumId",
  requiredSignIn,
  upload.array("newImages", 50),
  updateAlbum
);

router.post("/update-album-order", requiredSignIn, updateAlbumSequence);

module.exports = router;
