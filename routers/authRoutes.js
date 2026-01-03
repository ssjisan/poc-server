const express = require("express");

// import controller
const {
  registerUser,
  loginUser,
  privateRoute,
  removeUser,
  userList,
  changePassword,
  resetPassword,
} = require("../controller/authController");

// import middleware
const {
  requiredSignIn,
  isAdmin,
  isSuperAdmin,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", requiredSignIn, userList);
router.delete("/user/:userId", requiredSignIn, isSuperAdmin, removeUser);
router.get("/private", requiredSignIn, isAdmin, privateRoute);
router.post("/change-password", requiredSignIn, changePassword);
router.post("/reset-password/:userId", requiredSignIn, resetPassword);

router.get("/auth-check", requiredSignIn, (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
