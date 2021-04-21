import express from "express";
import {getUser, toggleFavoriteMusic} from "../controllers/controllers.js";

const router = express.Router({mergeParams : true});

router.patch("/", toggleFavoriteMusic);
router.get("/", getUser);

export {router};
