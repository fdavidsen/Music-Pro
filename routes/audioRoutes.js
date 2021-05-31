import express from "express";
import {upload} from "../models/audio.js";
import {
  getAllMusic,
  getMusicFile,
  uploadSingleMusic,
  deleteMusic,
  updateMusic,
  updateMusicTitleAndSinger,
  isAuth,
  isAdmin,
} from "../controllers/controllers.js";



const router = express.Router();

router.get("/", getAllMusic);
router.get("/file/:filename", getMusicFile);

router.post("/", isAdmin, upload.single("file"), uploadSingleMusic);
router.post("/delete/:musicId", isAdmin, deleteMusic);

router.post("/update/:musicId", isAdmin, upload.single("file"), updateMusic);
router.post("/update/without-file/:musicId", isAdmin, updateMusicTitleAndSinger);


export {router};
