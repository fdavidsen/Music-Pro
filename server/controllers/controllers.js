import express from "express";
import {gfs} from "../app.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import crypto from "crypto";
import Music from "../models/music.js";
import User from "../models/user.js";
import Token from "../models/token.js";


export const getMusicFile = async (req, res) => {
  //Find audio file
  await gfs.files.findOne({
    filename: req.params.filename,
  }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({message : "No audio with that file name"});
    }

    //File exist
    if (file.contentType = "audio/mpeg") {
      const readStream = gfs.createReadStream(file.filename);
      readStream.pipe(res);
    } else {
      //Not audio file
      return res.status(404).json({message : "Not an audio file"});
    }
  });
}



// Music Controller

export const getAllMusic = async (req, res) => {

  //Get all music
  const allMusic = await Music.find({}, (err,result)=>{
    if(err){return res.status(404).json({message : err});}
    return result;
  });

  return res.status(200).json({message : "Successfully fetched all music", data : allMusic})
};

export const getSingleMusic = async (req, res) => {
  const {musicId} = req.params;
  const music = await Music.findOne({_id : musicId}, (err, result)=> {
    if(err){return res.status(404).json({message : err});}
    return result;
  })

  return res.status(200).json({message : "Successfully fethed music",data : music});
}

export const uploadSingleMusic = async (req, res) => {
  const {title, singer} = req.body;
  const{filename} = req.file;


  const newMusic = await new Music({title, singer, filename}).save();


  res.status(200).json({message : "Successfully uploaded music",data :  newMusic});
}

export const deleteMusic = async (req,res) => {
  const {musicId} = req.params;

  const deletedMusic = await Music.findOneAndDelete({_id : musicId});

  if(!deletedMusic){return res.status(404).json({message : "No music with that id"});}

  const updateUser = await User.updateMany({}, {$pull : {favoriteMusic : {$in : [deletedMusic]}}}, (err, result)=>{
    if(err){return res.status(404).json({message : err});}
    return result;
  });

  const removedAudioFile = await gfs.remove({filename : deletedMusic.filename, root : "audios"}, (err, gridStore) =>{
    if(err){return res.status(404).json({message : err})};
    return gridStore;
  });

  return res.status(200).json({message : "Sucessfully deleted music"});

}



// User Controller

export const getUser = async (req, res) => {
  const {userId} = req.params;

  const user = await User.findById(userId, (err,result)=>{
    if(err){return res.status(404).json({message : err});}
    return result;
  })

  if(!user){
    return res.status(404).json({message : "No user with that id"});
  }else{
    return res.status(200).json({message : "User founded",data : {
      user : user._id,
      username : user.username,
      email : user.email,
      favoriteMusic : user.favoriteMusic,
    }});
  }
}

export const toggleFavoriteMusic = async (req, res) => {

  const {userId} = req.params;
  const {musicId} = req.body;

  //Find music
  const music = await Music.findById(musicId, (err,result)=>{
    if(err){return res.status(404).json({message : err});}
    return result;
  });

  //No music found
  if(!music){return res.status(404).json({message : "No music with that id"});}


  //Find user
  const user = await User.findById(userId, (err, result)=>{
    if(err){return res.status(404).json({message : err});}
    return result;
  })


  //No user found
  if(!user){return res.status(404).json({message : "No user with that id"});}

  //Add or remove music from user favorite music
  const userFavoriteMusics = user.favoriteMusic;
  const filteredMusics = userFavoriteMusics.filter((userFavoriteMusic) => ("" + userFavoriteMusic._id  !== "" + music._id));
  const updatedFavoriteMusics = (filteredMusics.length < userFavoriteMusics.length) ? filteredMusics : [...userFavoriteMusics , music];

  (updatedFavoriteMusics);

  //Patch user favorite music
  const updatedUser = await User.findByIdAndUpdate(userId, {favoriteMusic : updatedFavoriteMusics}, {new: true}, (err, result)=>{
    if(err){return res.status(404).json({message : err});}

    return result;
  });


  const message = `Succesfully ${filteredMusics.length < updatedFavoriteMusics.length ? 'added' : "removed"} ${musicId}'s music  from  ${userId}'s user favorite musics`;
  res.status(200).json({
    message,
    data : {
      _id : updatedUser._id,
      username : updatedUser.username,
      favoriteMusic : updatedUser.favoriteMusic,
    },
  })

}

export const registerUser = async (req,res) => {
  const {username, password, email} = req.body;

  // Check username has been taken
  var users = await User.find({$or : [{username}, {email}]}, (err,result)=>{
    if(err){return res.status(404).json({message : err});}
    return result;
  });


  if(users.length > 1){
    //Both username and email has been taken
    return res.status(404).json({message : "That username and email has been used"});
  }else if(users.length > 0){
    //Either username or email has been taken
    if(users[0].email === email && users[0].username === username){
      //Both username and email has been taken
      return res.status(404).json({message : "That username and email has been used"});
    }else if(users[0].email === email){
      //Email has been taken
      return res.status(404).json({message : "That email has been used"});
    }else if(users[0].username === username){
      //Username has been taken
      return res.status(404).json({message : "That username has been used"});
    }
  }

  bcrypt.hash(password, Number(process.env.SALT_ROUNDS),async (err, hashed)=> {
    if(err){return res.status(404).json({message : err});}

    const newUser = await new User({
      username,
      password : hashed,
      email,
      favoriteMusic : []
    }).save();


    return res.status(200).json({message : "Succesfully registered user", data : {
      _id : newUser._id,
      username : newUser.username,
      email : newUser.email,
      favoriteMusic : [],
    }});


  })

}

export const secret = async (req,res)=>{
  res.send("Secrets");
}

export const loginUser = async(req,res)=> {

  const {username, password} = req.body;

  const user = await User.findOne({username});

  if(!user){return res.status(404).json({message : "No user with that credentials"});}

  const isMatch = await bcrypt.compare(password, user.password);

  if(!isMatch){
    return res.status(404).json({message : "No user with that credentials"});
  }else{

    req.session.isAuth = true;
    req.session.username = username;
    return res.status(200).json({message : "Logged In"});
  }
}

export const isAuth = async (req,res,next) => {
  if(req.session.isAuth){
    next();
  }else{
    return res.status(404).json({message : "Unauthenticated"});
  }
}

export const forgetPassword = async(req,res)=>{
  const {email} = req.body;

  const user =  await User.findOne({email});


  if(!user){return res.status(404).json({message : "No user with that email"});}


  const checkToken = await Token.findOne({userId : user._id});

  if(checkToken){return res.status(404).json({message : "Reset password link has been sent to your email. Please check your email"});}

  let resetToken = crypto.randomBytes(32).toString("hex");


  bcrypt.hash(resetToken, Number(process.env.SALT_ROUNDS), async (err, hashed)=>{
    const newToken = await new Token({
      userId : user._id,
      token : hashed,
      createdAt : Date.now(),
    }).save();

    const userEmail = req.body.email;

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      port : 465,
      auth: {
        user: process.env.emailAddress,
        pass: process.env.emailPassword,
      }
    });




    let mailOptions = {
      from: process.env.emailAddress,
      to: user.email,
      subject: 'Reset your account password',
      html: '<h4><b>Reset Password</b></h4>' + '<p>To reset your password, complete this form:</p>' + '<a href="'+ `http://localhost:3000/reset?token=${hashed}&id=${user._id}` + '">Reset password</a>' + '<br><br>' + '<p>--Team</p>',
    }

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) throw err;

      return res.status(200).json(info);
    })
  });

}

export const logout = async (req,res)=>{
  req.session.destroy((err) => {
    if (!err) {
      return res.status(200).json({message : "Logged Out!"});
    } else {
      return res.status(404).json(err);
    }
  })
}


export const resetPassword = async (req,res)=>{

  const {token, id : userId } = req.query;


  const resetPasswordToken = await  Token.findOne({token, userId});
  const user = await User.findOne({_id : userId});

  if(!user){return res.status(404).json({message : "No user with that Id"});}

  if(!resetPasswordToken){return res.status(404).json({message : "Token has expired"});}

  const matchPreviousPassword = await  bcrypt.compare(req.body.password, user.password);

  if(matchPreviousPassword){return res.status(404).json({message : "Do not use your previous password"});}

  bcrypt.hash(req.body.password,Number(process.env.SALT_ROUNDS), (err, hashed)=>{
    User.findOneAndUpdate({_id : userId},{$set : {password : hashed}}, (err, result)=>{
      if(!result){
        res.status(404).json({message : err});
      }else{
        resetPasswordToken.deleteOne();
        res.status(200).json({message : "Succesfully change password"});
      }
    })
  });
}
