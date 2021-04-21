import express from "express";
import {loginUser, registerUser, secret, isAuth, forgetPassword, resetPassword, logout} from "../controllers/controllers.js";


const router = express.Router();


router.post("/login",loginUser);
router.post("/register",registerUser);
router.get("/secrets",isAuth, secret);
router.post("/logout", logout);
router.post("/forget", forgetPassword);
router.post("/reset", resetPassword);

export {router};
