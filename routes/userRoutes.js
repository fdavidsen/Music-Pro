import express from "express";
import path from "path";
import {getUser, toggleFavoriteMusic,isAuth} from "../controllers/controllers.js";

const router = express.Router({mergeParams : true});
const __dirname = path.resolve(path.dirname(''));


router.post("/", isAuth, toggleFavoriteMusic);
router.get("/", isAuth, getUser);

export {router};
