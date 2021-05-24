import mongoose from "mongoose";

const musicSchema = new mongoose.Schema({
  filename : {type : String , required : true},
  title : {type : String , required : true},
  singer : {type : String , required : true},
})

const Music = new mongoose.model('music', musicSchema);

export default Music;

export {musicSchema};
