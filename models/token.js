import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  userId : {
    type : String,
  },
  token : {
    type : String,
    required : true,
    unique : true,
  },
  createdAt : {
    type : Date,
    expires : 900,
  },
  tokenType : {
    type : String,
    enum : ['reset-password', 'validate-user'],
  },
  pin : {
    type : String,
  },
  userIdentity : {
    username : {type : String},
    displayName : {type : String},
    password : {type : String},
    email : {type : String,}
  }
});


tokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

const Token = new mongoose.model("token", tokenSchema);

export default Token;
