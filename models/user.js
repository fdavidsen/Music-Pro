import mongoose from "mongoose";
import {musicSchema} from "./music.js";
import passport from "passport";
import findOrCreate from "mongoose-findorcreate";
import googleAuth from "passport-google-oauth20";
import dotenv from "dotenv";
dotenv.config();

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  displayName: {
    type: String,
    required: true
  },
  password: {
    type: String
  },
  email: {
    type: String,
    unique: true,
  },
  googleId: String,
  userType: {
    type: String,
    default: "user",
    enum: ['admin', 'user'],
  },
  favoriteMusic: [musicSchema],
});

const User = new mongoose.model('user', userSchema);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

const GoogleStrategy = googleAuth.Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://music-pro-app.herokuapp.com/login/google/secrets",
    profileFields: ['email'],
  },
  async function(accessToken, refreshToken, profile, cb) {
    const {
      emails,
      id,
      displayName
    } = profile;

    const gmail = emails[0].value;

    const user = await User.findOne({
      googleId: id
    });


    if (!user) {

      const checkGmail = await User.findOne({
        email: gmail
      });

      if (!checkGmail) {
        const newUser = await new User({
          googleId: id,
          displayName: displayName,
          email: gmail,
        }).save();
        return cb(null, newUser);
      } else {
        return cb(null, user);
      }

      return cb(null, user);
    } else {
      return cb(null, user);
    }
  }
));


export default User;
