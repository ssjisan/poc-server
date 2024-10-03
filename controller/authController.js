import jwt from "jsonwebtoken";
import { comparePassword, hashPassword } from "../helper/passwordHash.js";
import UserModel from "../model/userModel.js";
import dotenv from "dotenv";

dotenv.config();

export const registerUser = async (req, res) => {
  try {
    // 1. destruct the element
    const { name, email, password, role } = req.body;
    // 2. Add Validation
    if (!name.trim()) {
      return res.json({ error: "Name is required" });
    }
    if (!email) {
      return res.json({ error: "Email is required" });
    }
    if (!password || password.length < 6) {
      return res.json({ error: "Password should be longer than 6 charecter" });
    }
    if (role === undefined) {
      return res.json({ error: "Role is required" });
    }
    // 3. Check the email is taken or not
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.json({ error: "Email is already taken" });
    }
    // 4. Hased the password
    const hashedPassword = await hashPassword(password);
    // 5. Create User
    const newUser = await new UserModel({
      name,
      email,
      password: hashedPassword,
      role
    }).save();
    // 6. Use JWT for auth
    const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECURE, {
      expiresIn: "7d",
    });
    // 7. Save User
    res.json({
      newUser: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    });
  } catch (err) {
    console.log(err);
  }
};

export const loginUser = async (req, res) => {
  try {
    // 1. destruct the element
    const { email, password } = req.body;
    // 2. Add Validation
    if (!email) {
      return res.json({ error: "Email is required" });
    }
    if (!password || password.length < 6) {
      return res.json({ error: "Password should be longer than 6 charecter" });
    }
    // 3. Check the email is taken or not
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.json({ error: "User Not Found" });
    }
    // 4. Hased the password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.json({ error: "Password wrong" });
    }

    // 5. Use JWT for auth
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECURE, {
      expiresIn: "7d",
    });
    // 6. Save User
    res.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.log(err);
  }
};

export const userList = async (req, res) => {
  try {
    const user = await UserModel.find({});
    res.json(user);
  } catch (err) {
    console.log(err.message);
  }
};



export const removeUser = async (req, res) => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.userId);
    res.json(user);
  } catch (err) {
    return res.status(400).json({ error: "Access Denied!" });
  }
};
export const privateRoute = async (req, res) => {
  res.json({ currentUser: req.user });
};


// Change Password Controller

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !oldPassword.trim()) {
      return res.status(400).json({ error: "Old password is required" });
    }
    if (!newPassword || !newPassword.trim()) {
      return res.status(400).json({ error: "New password is required" });
    }
    if (!confirmPassword || !confirmPassword.trim()) {
      return res.status(400).json({ error: "Confirm password is required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password should be longer than 6 characters" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New password and confirm password do not match" });
    }

    const existingUser = await UserModel.findById(req.user._id);
    const match = await comparePassword(oldPassword, existingUser.password);
    if (!match) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    const hashedPassword = await hashPassword(newPassword);
    existingUser.password = hashedPassword;
    await existingUser.save();

    res.json({ message: "Password changed successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { userId } = req.params;

    // Hash the new default password
    const hashedPassword = await hashPassword('123456');

    // Find the user and update their password
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Password has been reset to '123456'" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};