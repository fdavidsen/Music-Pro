import express from "express";
import {loginUser, registerUser, isAuth, isAdmin, forgetPassword, resetPassword, logout, verifyUser,getResetPasswordPage, loginWithGoogle
, getLoginPage, getRegisterPage, getForgotPasswordPage, getVerifyUserPage} from "../controllers/controllers.js";
import {passwordStrengthValidator, emailValidator, newPasswordStrengthValidator, usernameValidator} from "../controllers/validators.js";
import path from "path";
import passport from "passport";

const router = express.Router();
const __dirname = path.resolve(path.dirname(''));


router.get("/register", getRegisterPage);
router.post("/register", usernameValidator, emailValidator, passwordStrengthValidator, registerUser);


router.get("/verifyuser", getVerifyUserPage);
router.post("/verifyuser", verifyUser);

router.get("/login", getLoginPage);
router.post("/login", loginUser);

router.get("/login/google",passport.authenticate('google', { scope: ['profile','email'] }));
router.get("/login/google/failed",(req,res)=>{res.render("google-auth-error")});
router.get("/login/google/secrets",passport.authenticate("google", { failureRedirect: "/login/google/failed" }),loginWithGoogle);

router.get("/logout", logout);
router.get("/forget", getForgotPasswordPage);
router.post("/forget", forgetPassword);

router.get("/reset", getResetPasswordPage);
router.post("/reset", passwordStrengthValidator, resetPassword);


router.get("/admin", isAdmin, (req,res)=>{res.render("admin")})



export {router};
