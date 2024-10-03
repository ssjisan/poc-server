import express from "express";
const router = express.Router();

// import controller
import {
  registerUser,
  loginUser,
  privateRoute,
  removeUser,
  userList,
  changePassword,
  resetPassword
} from "../controller/authController.js";

// import middleware
import { requiredSignIn, isAdmin } from "../middlewares/authMiddleware.js";

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", requiredSignIn, userList);
router.delete("/user/:userId", requiredSignIn, isAdmin, removeUser);
router.get("/private", requiredSignIn, isAdmin, privateRoute);
router.post("/change-password", requiredSignIn, changePassword);
router.post('/reset-password/:userId', requiredSignIn,isAdmin, resetPassword);

router.get("/auth-check", requiredSignIn, (req, res) => {
  res.json({ ok: true });
});

export default router;
