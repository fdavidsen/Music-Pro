import mongoose from "mongoose";
import {musicSchema} from "./music.js";

const userSchema = new mongoose.Schema({
  username : {type : String, required : true, unique : true,},
  password : {type : String , required : true},
  email : {type : String, required : true, unique : true,},
  favoriteMusic : [musicSchema],
});


const User = new mongoose.model('user', userSchema);


export default User;
