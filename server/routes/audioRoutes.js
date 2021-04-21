import express from "express";
import {upload} from "../models/audio.js";
import {getAllMusic, uploadSingleMusic,getSingleMusic, getMusicFile, deleteMusic,isAuth} from "../controllers/controllers.js";

const router = express.Router();


router.get("/", getAllMusic);
router.get("/:musicId", getSingleMusic);
router.get("/file/:filename",isAuth, getMusicFile);
router.post("/",upload.single("file"),uploadSingleMusic);
router.delete("/:musicId", deleteMusic);


export {router};
