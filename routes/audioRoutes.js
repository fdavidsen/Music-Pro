import express from "express";
import {upload} from "../models/audio.js";
import {getAllMusic, uploadSingleMusic, getMusicFile, deleteMusic,isAuth, isAdmin, toggleFavoriteMusic} from "../controllers/controllers.js";

const router = express.Router();


router.get("/", getAllMusic);
router.get("/file/:filename", getMusicFile);

router.post("/",isAdmin, upload.single("file"),uploadSingleMusic);
router.delete("/:musicId",isAdmin, deleteMusic);


export {router};
