import express from "express";
import {
  loginUsers,
  loginWithGoogle,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  sendOTP,
  resetPassword
} from "../controllers/userController.js";

const userRouter = express.Router();

// ======================== AUTH ROUTES ========================
userRouter.post("/login", loginUsers);
userRouter.post("/login-google", loginWithGoogle);
userRouter.post("/send-OTP", sendOTP);        // fixed typo
userRouter.post("/reset-password", resetPassword);

// ======================== USER MANAGEMENT ========================
userRouter.get("/users", getUsers);          // get all users (admin)
userRouter.get("/", getUser);                // get authenticated user
userRouter.put("/:memberId", updateUser);    // update user
userRouter.delete("/:memberId", deleteUser); // delete user

export default userRouter;
