import express from "express";
import {upload} from "../models/audio.js";
import {getAllMusic, uploadSingleMusic, getMusicFile,updateMusic,updateMusicTitleAndSinger, deleteMusic,deleteAudio,isAuth, isAdmin, toggleFavoriteMusic} from "../controllers/controllers.js";

const router = express.Router();


router.get("/", getAllMusic);
router.get("/file/:filename", getMusicFile);

router.post("/",isAdmin, upload.single("file"),uploadSingleMusic);
router.post("/delete/:musicId",isAdmin, deleteMusic);


router.post("/update/:musicId",isAdmin, upload.single("file"),updateMusic);
router.post("/update/without-file/:musicId", isAdmin, updateMusicTitleAndSinger);

router.post("/delete/audio/:filename", deleteAudio);



export {router};
