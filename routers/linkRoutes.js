const express = require("express");

// import controller
const {
  createLink,
  listOfLinks,
  readLink,
  updateLink,
  removeLink,
  updateLinksSequence,
} = require("../controller/linkController");

// import middleware
const { requiredSignIn } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/add_link", requiredSignIn, createLink);
router.get("/links", listOfLinks);
router.get("/link/:linkId", requiredSignIn, readLink);
router.put("/link/:linkId", requiredSignIn, updateLink);
router.delete("/link/:linkId", removeLink);
router.post("/update-links-order", requiredSignIn, updateLinksSequence);

module.exports = router;
