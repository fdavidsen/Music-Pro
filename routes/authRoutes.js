import express from "express";
import path from "path";
import passport from "passport";

import {
  getRegisterPage,
  registerUser,

  getVerifyUserPage,
  verifyUser,

  getLoginPage,
  loginUser,
  loginWithGoogle,
  getGoogleAuthErrorPage,

  getForgotPasswordPage,
  forgetPassword,

  getResetPasswordPage,
  resetPassword,

  getAdminPage,

  logout,

  isAuth,
  isAdmin,

} from "../controllers/controllers.js";

import {
  passwordStrengthValidator,
  emailValidator,
  newPasswordStrengthValidator,
  usernameValidator
} from "../controllers/validators.js";


const router = express.Router();
const __dirname = path.resolve(path.dirname(''));


router.get("/register", getRegisterPage);
router.post("/register", usernameValidator, emailValidator, passwordStrengthValidator, registerUser);


router.get("/verifyuser", getVerifyUserPage);
router.post("/verifyuser", verifyUser);

router.get("/login", getLoginPage);
router.post("/login", loginUser);

router.get("/login/google", passport.authenticate('google', {scope: ['profile', 'email']}));
router.get("/login/google/failed", (req, res) => {getGoogleAuthErrorPage});
router.get("/login/google/secrets", passport.authenticate("google", {failureRedirect: "/login/google/failed"}), loginWithGoogle);


router.get("/forget", getForgotPasswordPage);
router.post("/forget", forgetPassword);

router.get("/reset", getResetPasswordPage);
router.post("/reset", passwordStrengthValidator, resetPassword);

router.get("/admin", isAdmin, getAdminPage);

router.get("/logout", logout);



export {router};
