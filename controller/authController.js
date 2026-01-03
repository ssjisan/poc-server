const jwt = require("jsonwebtoken");
const { comparePassword, hashPassword } = require("../helper/passwordHash");
const UserModel = require("../model/userModel");
const dotenv = require("dotenv");

dotenv.config();

// Register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name.trim()) return res.json({ error: "Name is required" });
    if (!email) return res.json({ error: "Email is required" });
    if (!password || password.length < 6)
      return res.json({ error: "Password should be longer than 6 characters" });
    if (role === undefined) return res.json({ error: "Role is required" });

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) return res.json({ error: "Email is already taken" });

    const hashedPassword = await hashPassword(password);

    const newUser = await new UserModel({
      name,
      email,
      password: hashedPassword,
      role,
    }).save();

    const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECURE, {
      expiresIn: "7d",
    });

    res.json({
      newUser: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) return res.json({ error: "Email is required" });
    if (!password || password.length < 6)
      return res.json({ error: "Password should be longer than 6 characters" });

    const user = await UserModel.findOne({ email });
    if (!user) return res.json({ error: "User not found" });

    const match = await comparePassword(password, user.password);
    if (!match) return res.json({ error: "Password wrong" });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECURE, {
      expiresIn: "7d",
    });

    res.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Get list of users
const userList = async (req, res) => {
  try {
    const currentUser = await UserModel.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    let users;
    if (currentUser.role === 0) {
      users = await UserModel.find({});
    } else if (currentUser.role === 1) {
      users = await UserModel.find({ role: { $ne: 0 } });
    } else {
      return res.status(403).json({ error: "Access Denied" });
    }

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Remove user
const removeUser = async (req, res) => {
  try {
    if (req.user.role === 0 && req.user._id.toString() === req.params.userId) {
      return res
        .status(400)
        .json({ error: "Super Admin cannot remove their own account" });
    }

    const user = await UserModel.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User removed successfully", user });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Access Denied!" });
  }
};

// Private route
const privateRoute = async (req, res) => {
  res.json({ currentUser: req.user });
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword?.trim())
      return res.status(400).json({ error: "Old password is required" });
    if (!newPassword?.trim())
      return res.status(400).json({ error: "New password is required" });
    if (!confirmPassword?.trim())
      return res.status(400).json({ error: "Confirm password is required" });
    if (newPassword.length < 6)
      return res
        .status(400)
        .json({ error: "New password should be longer than 6 characters" });
    if (newPassword !== confirmPassword)
      return res
        .status(400)
        .json({ error: "New password and confirm password do not match" });

    const existingUser = await UserModel.findById(req.user._id);
    const match = await comparePassword(oldPassword, existingUser.password);
    if (!match)
      return res.status(400).json({ error: "Old password is incorrect" });

    existingUser.password = await hashPassword(newPassword);
    await existingUser.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const hashedPassword = await hashPassword("123456");

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Password has been reset to '123456'" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  userList,
  removeUser,
  privateRoute,
  changePassword,
  resetPassword,
};
