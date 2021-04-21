import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  userId : {
    type : String,
    required : true,
    unique : true,
  },
  token : {
    type : String,
    required : true,
    unique : true,
  },
  createdAt : {
    type : Date,
    expires : 60,
  },
});


tokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });

const Token = new mongoose.model("token", tokenSchema);

export default Token;
