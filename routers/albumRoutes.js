const express = require("express");
const router = express.Router();
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const {
  createAlbum,
  downloadAlbum,
  updateAlbumOrder,
  updateAlbum,
  listOfAllAlbums,
  deleteAlbum,
  readAlbum,
  destroyImage,
} = require("../controller/albumController.js");

router.post("/delete-image", requiredSignIn, destroyImage);
router.post("/create-album", requiredSignIn, createAlbum);
router.get("/:slug/download", requiredSignIn, downloadAlbum);
router.post("/update-album-order", requiredSignIn, updateAlbumOrder);
router.get("/albums", listOfAllAlbums);
router.delete("/album/:albumId", requiredSignIn, deleteAlbum);
router.get("/album/:albumId", readAlbum);
router.put("/album/:albumId", requiredSignIn, updateAlbum);

module.exports = router;
