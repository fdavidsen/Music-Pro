import GridFsStorage from "multer-gridfs-storage";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import dotenv from  'dotenv';

dotenv.config();

const mongoURI = process.env.DATABASE_URI

const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'audios'
        };
        resolve(fileInfo);
      });
    });
  },
  options : {useUnifiedTopology : true, useNewUrlParser : true}
});
const upload = multer({ storage });


export {upload, storage};
