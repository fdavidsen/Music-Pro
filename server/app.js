import express from "express";
import mongoose from "mongoose";
import path from "path";
import Grid from "gridfs-stream";
import methodOverride from "method-override";
import bodyParser from "body-parser";
import session from "express-session";
import dotenv from  'dotenv';
import cors from "cors";
import ConnectMongoDBSession from "connect-mongodb-session";

//Routes
import {router as AudioRoutes} from "./routes/audioRoutes.js";
import {router as UserRoutes} from "./routes/userRoutes.js";
import {router as AuthRoutes} from "./routes/authRoutes.js";

dotenv.config();


const app = express();
const port = process.env.PORT || 3000;
const __dirname = path.resolve(path.dirname(''));
const MongoDBSession = ConnectMongoDBSession(session);
const store = new MongoDBSession({
  uri : process.env.DATABASE_URI,
  collection : "sessions",
});


//Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use(methodOverride('_method'));
app.use(cors());

app.use(session({
  secret : process.env.SESSION_KEY,
  resave : false,
  saveUninitialized : false,
  store : store,
}));


//routes
app.use("/music", AudioRoutes);
app.use("/user/:userId", UserRoutes);
app.use("/", AuthRoutes);



const mongoURI = process.env.DATABASE_URI;

//Connect to Database and Set GridFS
const conn = mongoose.connection;

let gfs;

await mongoose.connect(mongoURI, {useNewUrlParser : true, useUnifiedTopology : true})
.then((connection )=> {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('audios');
})
.catch((err) => {
  console.log(err);
});


//Export Gfs to be used to find files
export {conn, gfs};




app.listen(port, function(){
  console.log(`Connected to port ${port}`);
})
