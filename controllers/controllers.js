import express from "express";
import {gfs} from "../app.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import crypto from "crypto";
import path from "path";
import Music from "../models/music.js";
import User from "../models/user.js";
import Token from "../models/token.js";
import {validationResult} from "express-validator";
import lodash from "lodash";
import url from "url";


const __dirname = path.resolve(path.dirname(''));

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= EXTRA FUNCTIONS =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function makeid(length) {

  var result = [];
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;

  for (var i = 0; i < length; i++) {
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
  }

  return result.join('');

}


function capitalize(str) {

  const temp = str.split("");

  const upperRegex = new RegExp(/[A-Z]/);
  const lowerRegex = new RegExp(/[a-z]/);
  const alphaRegex = new RegExp(/[A-Za-z]/);
  const spaceRegex = new RegExp(/[ ]/);

  var output = "";
  var isAlpha = true;

  temp.forEach((chr) => {
    if (alphaRegex.test(chr)) {

      if (isAlpha) {
        output += chr.toUpperCase();
        isAlpha = false;
      } else {
        output += chr.toLowerCase();
      }

    } else {

      output += chr;
      if (spaceRegex.test(chr)) {
        isAlpha = true;
      }

    }
  });

  return output;
}


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= MUSIC CONTROLLER =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=



// FUNCTION : GET MP3 FILE FOR USER TO PLAY
export const getMusicFile = async (req, res) => {

  // GET AUDIO FILE FROM DATABASE
  await gfs.files.findOne({filename: req.params.filename,}, (err, file) => {

    if (!file || file.length === 0) {
      return res.status(404).json({
        message: "No audio with that file name"
      });
    }

    // FILE EXISTS
    if (file.contentType = "audio/mpeg") {

      const range = req.headers.range;

      if (!range) {
        return res.status(500).send(range);
      }

      const videoSize = file.length;
      const parts = range.replace(/bytes=/, "").split("-");
      const start = Number(parts[0]);
      const end = (parts[1] !== '') ? parts[1] : videoSize - 1;

      const contentLength = end - start + 1;

      const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "audio/mpeg",
      };

      res.writeHead(206, headers);
      const readStream = gfs.createReadStream({
        filename: file.filename,
        range: {
          startPos: start,
          endPos: end,
        }
      }).on("open", function() {
        readStream.pipe(res);
      }).on("error", function(err) {
        res.end(err);
      });
    } else {
      // NOT AN AUDIO FILE
      return res.status(404).json({
        message: "Not an audio file"
      });
    }
  });
}


// FUNCTION : GET ALL MUSIC LIST (INCL. SINGER, TITLE AND MUSIC FILE)
export const getAllMusic = async (req, res) => {

  // GET QUERY
  const {query} = req;
  const queries = (query.q) ? capitalize(query.q) : "";

  // GET ALL MUSIC FROM DATABASE
  const allMusic = await Music.find({}, (err, result) => {

    if (err) {
      return res.status(404).json({
        message: err
      });
    }

    return result;
  });

  // SORT MUSIC LIST BY TITLE AND SINGER
  allMusic.sort((a, b) => {
    if (a.title > b.title) return 1;
    if (a.title < b.title) return -1;
    if (a.title === b.title) {
      if (a.singer > b.singer) return 1;
      if (a.singer < b.singer) return -1;
      return 0;
    }
  });

  // DIFFERS THE LIKE BUTTON TO "LIKE" AND "DISLIKE"
  if (!req.session.isAuth) {

    // NO USERS AUTHENTICATED
    // HENCE, ALL THE BUTTON DISPLAYS "LIKE"
    const newArray = allMusic.map((music) => {
      const temp = JSON.parse(JSON.stringify(music));
      temp.likeButton = "Like";
      return temp;
    });

    // FILTER MUSIC BASED ON QUERIES  (TITLE OR SINGER)
    const queriedMusic = newArray.filter(function(str) {
      return ((str.title.includes(queries)) || (str.singer.includes(queries)));
    })

    return res.render("index", {
      data: queriedMusic,
      isAuth: 0,
      page: "music",
      inputBox: (req.query.q) ? (req.query.q) : "",
      isAdmin: 0,
    });

  } else {

    // USER IS AUTHENTICATED
    // DIFFERS THE BUTTONS BETWEEN "LIKE" AND "DISLIKE" (UNION)
    const {userId} = req.session;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "No user with that id"
      });
    }

    const userFavoriteMusic = user.favoriteMusic;

    let newArray = [];
    let idx = 0;

    // DIFFERS THE LIKE BUTTON TO "LIKE" AND "DISLIKE"
    if (userFavoriteMusic.length > 0) {

      allMusic.forEach((music) => {
        const temp = JSON.parse(JSON.stringify(music));
        if (userFavoriteMusic[idx]._id.equals(music._id)) {
          temp.likeButton = "Dislike";
          idx = (idx + 1 < userFavoriteMusic.length) ? idx + 1 : idx;
        } else {
          temp.likeButton = "Like";
        }
        newArray.push(temp);
      })

    } else {

      newArray = allMusic.map(music => {
        const temp = JSON.parse(JSON.stringify(music));
        temp.likeButton = "Like";
        return temp;
      })

    }

    // FILTER MUSIC BASED ON QUERIES (TITLE OR SINGER)
    const queriedMusic = newArray.filter(function(str) {
      return ((str.title.includes(queries)) || (str.singer.includes(queries)));
    })

    return res.render("index", {
      data: queriedMusic,
      isAuth: req.session.isAuth,
      isAdmin: req.session.isAdmin,
      page: "music",
      inputBox: (req.query.q) ? (req.query.q) : "",
    });
  }
};


// FUNCTION : POST/UPLOAD A NEW MUSIC (ADMIN)
export const uploadSingleMusic = async (req, res) => {

  const {title: titleInput,singer: singerInput} = req.body;
  const {filename} = req.file;

  // CAPITALIZE EACH WORD IN TITLE AND SINGER
  const title = capitalize(titleInput)
  const singer = capitalize(singerInput);

  const newMusic = await new Music({
    title,
    singer,
    filename
  }).save();

  return res.redirect("/admin");
}


// FUNCTION : EDIT MUSIC (ADMIN)
export const updateMusic = async (req, res) => {

  const {musicId} = req.params;
  const {title: titleInput,singer: singerInput,filename: oldFilename} = req.body;
  const {filename} = req.file;

  const title = capitalize(titleInput);
  const singer = capitalize(singerInput);

  const removedAudioFile = await gfs.remove({filename: oldFilename,root: "audios"}, (err, gridStore) => {
    if (err) {
      return res.status(404).json({
        message: err
      })
    };
    return gridStore;
  });

  const updatedUser = await User.updateMany({favoriteMusic: {$elemMatch: {_id: musicId}}}, {
    $set: {
      "favoriteMusic.$.title": title,
      "favoriteMusic.$.singer": singer,
      "favoriteMusic.$.filename": filename
    }
  }, function(err, result) {
    if (err) {
      return res.status(404).json(err);
    }
    return result;
  });


  const updatedMusic = await Music.findByIdAndUpdate(musicId, {title,singer,filename}, {new: true}, (err, result) => {
    if (err) {
      return res.status(404).json(err);
    }
    return result;
  });


  return res.redirect("/admin");
}


// FUNCTION : EDIT MUSIC (WITHOUT FILE)
export const updateMusicTitleAndSinger = async (req, res) => {

  const {musicId} = req.params;
  const {title: titleInput, singer: singerInput, filename} = req.body;

  const title = capitalize(titleInput);
  const singer = capitalize(singerInput);

  const updatedUser = await User.updateMany({favoriteMusic: {$elemMatch: {_id: musicId}}}, {
    $set: {
      "favoriteMusic.$.title": title,
      "favoriteMusic.$.singer": singer,
      "favoriteMusic.$.filename": filename
    }
  }, function(err, result) {
    if (err) {
      return res.status(404).json(err);
    }
    return result;
  });


  const updatedMusic = await Music.findByIdAndUpdate(musicId, {title, singer, filename}, {new: true}, (err, result) => {
    if (err) {
      return res.status(404).json(err);
    }
    return result;
  });


  return res.redirect("/admin");
}


// FUCNTION : DELETE SINGLE MUSIC (ADMIN)
export const deleteMusic = async (req, res) => {
  const {musicId} = req.params;


  // DELETE MUSIC FROM MUSIC LIST
  const deletedMusic = await Music.findOneAndDelete({_id: musicId});

  if (!deletedMusic) {
    return res.status(404).json({
      message: "No music with that id"
    });
  }

  // DELETE MUSIC FROM USER THAT HAVE THE DELETED MUSIC
  const updateUser = await User.updateMany({}, {$pull: {favoriteMusic: {$in: [deletedMusic]}}}, (err, result) => {
    if (err) {
      return res.status(404).json({
        message: err
      });
    }
    return result;
  });

  // DELETE AUDIO FILE & CHUNKS FROM DATABASE
  const removedAudioFile = await gfs.remove({filename: deletedMusic.filename,root: "audios"}, (err, gridStore) => {
    if (err) {
      return res.status(404).json({
        message: err
      })
    };
    return gridStore;
  });

  return res.status(200).json({
    message: "Sucessfully deleted music"
  });

}



// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= USER CONTROLLER =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

// FUNCTION : GET USER CREDENTIALS (DISPLAYNAME, FAVORITEMUSIC)
// :: return isAuth and page is for front-end purpose
export const getUser = async (req, res) => {

  // GET USER FROM SESSION.USERID
  const {userId} = req.session;

  // FIND USER
  // TO MAKE SURE USER IS VALID (UNAVAILABLE)
  const user = await User.findById(userId, (err, result) => {
    if (err) {
      return res.status(404).json({
        message: err
      });
    }
    return result;
  });


  // NO USER WITH THAT ID
  if (!user) {
    return res.status(404).json({
      message: "No user with that id"
    });
  } else {
    // CAPITALIZE ALL WORDS IN QUERIES TO MATCH TITLE & SINGER IN DATABASE
    const queries = (req.query.q) ? capitalize(req.query.q) : "";

    const temp = user.favoriteMusic;

    // FILTER MUSIC BASED ON QUERIES (TITLE & SINGER)
    const userFavoriteMusic = temp.filter(function(str) {
      return ((str.title.includes(queries)) || (str.singer.includes(queries)));
    })


    // ASSIGN LIKED BUTTON TO DISLIKE
    // BECAUSE IT IS VIEWING THE USER FAVORITE MUSIC LIST
    const newArray = userFavoriteMusic.map((music) => {
      const temp = JSON.parse(JSON.stringify(music));
      temp.likeButton = "Dislike";
      return temp;
    });

    return res.render("profile", {
      data: {
        displayName: user.displayName,
        favoriteMusic: newArray,
      },
      isAdmin: req.session.isAdmin,
      isAuth: req.session.isAuth,
      page: "profile",
      inputBox: (req.query.q) ? (req.query.q) : "",
    });
  }
}


// FUNCTION : TO ADD OR REMOVE MUSIC FROM CURRENT USER'S FAVORITE MUSIC LIST
export const toggleFavoriteMusic = async (req, res) => {

  const {userId} = req.session;
  const {musicId} = req.body;

  // FIND MUSIC
  // TO MAKE SURE THE MUSIC ID IS VALID AND MUSIC IS AVAILABLE
  const music = await Music.findById(musicId, (err, result) => {
    if (err) {
      return res.status(404).json({
        message: err
      });
    }
    return result;
  });

  // NO MUSIC WITH THAT ID (UNAVAILABLE)
  if (!music) {
    return res.status(404).json({
      message: "No music with that id"
    });
  }


  // FIND USER
  // TO MAKE SURE USER IS VALID AND AVAILABLE
  const user = await User.findById(userId, (err, result) => {
    if (err) {
      return res.status(404).json({
        message: err
      });
    }
    return result;
  })


  // NO USER WITH THAT ID (UNAVAILABLE)
  if (!user) {
    return res.status(404).json({
      message: "No user with that id"
    });
  }

  // DETERMINE TO ADD OR REMOVE MUSIC TO/FROM CURRENT USER'S FAVORITE MUSIC LIST
  const userFavoriteMusics = user.favoriteMusic;
  const filteredMusics = userFavoriteMusics.filter((userFavoriteMusic) => (!userFavoriteMusic._id.equals(music._id)));

  const updatedFavoriteMusics = (filteredMusics.length < userFavoriteMusics.length) ? filteredMusics : [...userFavoriteMusics, music];

  // SORT THE UPDATED FAVORITE MUSICS
  updatedFavoriteMusics.sort((a, b) => {
    if (a.title > b.title) return 1;
    if (a.title < b.title) return -1;
    if (a.title === b.title) {
      if (a.singer > b.singer) return 1;
      if (a.singer < b.singer) return -1;
      return 0;
    }
  })

  // UPDATE USER'S FAVORITE MUSIC LIST TO THE UPDATED ONE
  await User.findByIdAndUpdate(userId, {
    favoriteMusic: updatedFavoriteMusics
  }, {
    new: true
  }, (err, result) => {
    if (err) {
      return res.status(404).json({
        message: err
      });
    }
    return result;
  });

  // SEND LIKE OR DISLIKE FOR BUTTON TEXT
  return res.status(200).json({
    message: (filteredMusics.length < userFavoriteMusics.length) ? "Dislike" : "Like"
  });
}


// FUNCTION : REGISTER NEW USER
export const registerUser = async (req, res) => {

  const {username,displayName,password,email} = req.body;

  // CHECK INPUT NOT EMPTY
  if (!username || !displayName || !password || !email) {
    return res.render("register", {
      message: "Please input all fields",
      inputBox: req.body,
    })
  }

  // CHECK PASSWORD & EMAIL VALIDATION
  const errors = validationResult(req);

  // ERRORS ON VALIDATION
  if (!errors.isEmpty()) {
    const errorArray = errors.array();

    // VIEW THE FIRST ERRORS OF VALIDATION (USENRAME AND EMAIL)
    if (errorArray[0].param === "username" || errorArray[0].param === "email") {
      return res.render("register", {
        message: errorArray[0].msg,
        inputBox: req.body,
      });
    }
  }

  // CHECK USER WITH THAT USERNAME
  // TO MAKE SURE ITS UNIQUE
  var users = await User.find({
    $or: [{
      username
    }, {
      email
    }]
  }, (err, result) => {
    if (err) {
      return res.status(404).json({
        message: err
      });
    }
    return result;
  });


  if (users.length > 1) {

    // BOTH USERNAME AND EMAIL IS TAKEN
    return res.render("register", {
      message: "That username and email has been used",
      inputBox: req.body
    });
  } else if (users.length > 0) {

    // EITHER USERNAME OR EMAIL HAS BEEN TAKEN
    if (users[0].email === email && users[0].username === username) {
      // BOTH USERNAME AND EMAIL HAS BEEN TAKEN
      return res.render("register", {
        message: "That username and email has been used",
        inputBox: req.body
      });
    } else if (users[0].email === email) {

      // ONLY EMAIL HAS BEEN TAKEN
      return res.render("register", {
        message: "That email has been used",
        inputBox: req.body
      });
    } else if (users[0].username === username) {

      // ONLY USERNAME HAS BEEN TAKEN
      return res.render("register", {
        message: "That username has been used",
        inputBox: req.body
      });
    }
  }

  if (!errors.isEmpty()) {

    const errorArray = errors.array();
    // VIEW PASSWORD ERROR VALIDATION
    if (errorArray[0].param === "password") {
      return res.render("register", {
        message: errorArray[0].msg,
        inputBox: req.body,
      });
    }

  }

  // HASHING THE PASSWORD
  bcrypt.hash(password, Number(process.env.SALT_ROUNDS), async (err, hashedPassword) => {

    if (err) {
      res.status(404).json({
        err,
      })
    }

    // CREATE RANDOM BYTES TO BE HASHED FOR TOKEN
    let validateUserToken = crypto.randomBytes(32).toString("hex");

    // HASHING THE TOKEN
    bcrypt.hash(validateUserToken, Number(process.env.SALT_ROUNDS), async (err, hashedToken) => {
      let pin = "";

      // CREATE 6-DIGIT PIN
      pin = makeid(6);


      var transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 465,
        secureConnection : true,
        auth: {
          user: process.env.emailAddress,
          pass: process.env.emailPassword,
        }
      });

      //MAIL OPTIONS
      let mailOptions = {
        from: process.env.emailAddress,
        to: email,
        subject: 'Verify your account',
        html: '<h4><b>Account verification</b></h4>' + '<p>Pin : </p>' + `<h2>${pin}</h2>` + "<br></br>" + `<a href="${req.protocol}://${req.headers.host}/verifyuser?token=${hashedToken}">Verify User</a>` + '<br><br>' + '<p>--Team</p>',
      }

      // SEND MAIL
      transporter.sendMail(mailOptions, async (err, info) => {
        if (err) {
          return res.status(404).json({
            message: err
          })
        };
      })

      // CREATING NEW TOKEN
      await new Token({
        token: hashedToken,
        userIdentity: {
          username: username,
          password: hashedPassword,
          email: email,
          displayName: displayName,
        },
        tokenType: "validate-user",
        pin,
        createdAt: Date.now(),
      }).save();


      return res.redirect("/verifyuser?token=" + hashedToken);
    })
  })
}


// FUNCTION : VERIFY USER - BY MATCHING 6 DIGIT PIN SENT TO USER'S EMAIL
export const verifyUser = async (req, res) => {

  // 6-DIGIT PIN INPUT
  const {pinChar} = req.body;
  const pin = pinChar.join("").toUpperCase();

  const {token} = req.query;

  // CHECK TOKEN TO VALIDATE TOKEN
  // TO CHECK TOKEN IS VALID (AVAILABLE)
  const validateUserToken = await Token.findOne({
    token,
    tokenType: "validate-user"
  });

  // NO TOKEN FOUNDED
  if (!validateUserToken) {
    // TOKEN EXPIRED
    return res.render("auth-error", {
      message: "Token has expires"
    });
  }

  // COMPARE USER INPUT'S PIN WITH THE ACTUAL PIN
  if (validateUserToken.pin === pin) {

    // PIN IS CORRECT
    const {
      userIdentity
    } = validateUserToken;

    // CREATE USER USING THE USER IDENDITY IN THE TOKEN
    const temp = JSON.parse(JSON.stringify(userIdentity))
    temp.favoriteMusic = [];
    await new User(temp).save();

    // DELETE ALL QUEUED (PENDING) TOKEN THAT HAS THE SAME EMAIL
    await Token.deleteMany({
      "userIdentity.email": userIdentity.email
    });

    return res.redirect("/login");
  } else {
    // PIN IS INCORRECT
    return res.render("verify-user", {
      message: "Pin is incorrect",
      inputBox: {
        pin: pin
      }
    });
  }
}


// FUNCTION : LOGIN USER
export const loginUser = async (req, res) => {

  const {username,password} = req.body;

  // CHECK USER INPUT NOT EMPTY
  if (!username || !password) {
    if (!username && !password) {
      return res.render("login", {
        message: "Please enter username and password",
        inputBox: req.body,
      })
    } else if (!username) {
      return res.render("login", {
        message: "Please enter username",
        inputBox: req.body,
      })
    } else if (!password) {
      return res.render("login", {
        message: "Please enter password",
        inputBox: req.body,
      })
    }
  }


  // FIND USER BY USERNAME
  // to make sure username is valid (available)
  const user = await User.findOne({username});

  // NO USER WITH THAT USERNAME (UNAVAILABLE)
  if (!user) {
    return res.render("login", {
      message: "No user with that credentials",
      inputBox: req.body,
    });
  }

  // COMPARING INPUT PASSWORD WITH USER'S PASSWORD
  const isMatch = await bcrypt.compare(password, user.password);

  // WRONG PASSWORD (IS NOT MATCH)
  if (!isMatch) {
    return res.render("login", {
      message: "No user with that credentials",
      inputBox: req.body,
    });
  } else {

    // CORRECT PASSWORD

    // SETTING SESSIONS
    req.session.isAuth = true;
    req.session.isAdmin = (user.userType === "admin");
    req.session.userId = user._id;

    res.redirect("/music");
  }
}


// FUNCTION : LOGIN WITH GOOGLE
export const loginWithGoogle = async (req, res) => {
  req.session.userId = req.user._id;
  req.session.isAdmin = 0;
  req.session.isAuth = 1;
  res.redirect("/music");
}


// FUNCTION : FORGET PASSWORD (REQUEST TO RESET PASSWORD BY EMAIL)
// reset password link will be send to the inputted email
export const forgetPassword = async (req, res) => {
  const {email} = req.body;


  // FIND A NON-GOOGLE AUTHENTICATED USER BY EMAIL
  const user = await User.findOne({
    $and: [{
      email
    }, {
      googleId: null
    }]
  });

  // NO USER FOUNDED WITH THAT EMAIL
  if (!user) {
    res.render("password-reset", {
      message: "No user with that email. Please try another one."
    })
  }

  // FIND A TOKEN WITH THAT USERID
  // to prevent reset-password mail spamming
  const checkToken = await Token.findOne({
    userId: user._id
  });


  // RESET PASSWORD TOKEN IS STILL WAITING
  // thus preventing reset-password mail spamming
  if (checkToken) {
    return res.render("forget-password-link-has-been-send", {
      email: email
    });
  }


  // CREATING TOKEN
  let resetToken = crypto.randomBytes(32).toString("hex");

  // HASHING THE TOKEN
  bcrypt.hash(resetToken, Number(process.env.SALT_ROUNDS), async (err, hashed) => {

    // SENDING THE RESET-PASSWORD LINK TO USER'S EMAIL
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 465,
      secureConnection : true,
      auth: {
        user: process.env.emailAddress,
        pass: process.env.emailPassword,
      }
    });

    // MAIL OPTIONS
    let mailOptions = {
      from: process.env.emailAddress,
      to: email,
      subject: 'Reset your account password',
      html: '<h4><b>Reset Password</b></h4>' + '<p>To reset your password, complete this form:</p>' + '<a href="' + `${req.protocol}://${req.headers.host}/reset?token=${hashed}&id=${user._id}` + '">Reset password</a>' + '<br><br>' + '<p>--Team</p>',
    }

    // SEND EMAIL
    transporter.sendMail(mailOptions, async (err, info) => {
      if (err) {
        return res.status(404).json({
          message: err
        })
      };


      // SAVE THE TOKEN TO THE DATABASE
      const newToken = await new Token({
        userId: user._id,
        token: hashed,
        tokenType: 'reset-password',
        createdAt: Date.now(),
      }).save();


      return res.render("forget-password-link-has-been-send", {
        email: email
      });
    })
  });
}


// FUNCTION : LOGOUT
export const logout = async (req, res) => {

  // DESTROY SESSION
  req.session.destroy((err) => {
    if (!err) {
      res.redirect("/music");
    } else {
      return res.status(404).json(err);
    }
  })
}


// FUNCTION : RESET USER'S PASSWORD
// user will have about 15 minutes to set their password
export const resetPassword = async (req, res) => {

  const {token,id: userId} = req.query;

  // FIND TOKEN
  // to make sure token is valid (available)
  const resetPasswordToken = await Token.findOne({token,userId});

  // NO TOKEN AVAILABLE (Token has expires)
  if (!resetPasswordToken) {
    return res.render("auth-error", {
      message: "Token has expired"
    })
  }

  // FIND USER BY ID
  // to make sure user is valid (available)
  const user = await User.findOne({_id: userId});

  // NO USER WITH THAT ID (UNAVAILABLE)
  if (!user) {
    return res.status(404).json("No user with id");
  }

  // CHECK PASSWORD VALIDATION
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // SEND ERROR TO FRONT-END
    return res.render("password-change", {
      message: errors.array()[0].msg,
    });
  }

  const {password: newPassword,confirmPassword} = req.body;

  // CHECK PASSWORD AND CONFIRM PASSWORD
  // to match password and confirm-password
  if (newPassword !== confirmPassword) {
    return res.render("password-change", {
      message: "Password does not match"
    });
  }

  // COMPARE NEW PASSWORD AND PREVIOUS PASSWORD
  // to make sure the user changed their password
  const matchPreviousPassword = await bcrypt.compare(newPassword, user.password);

  // NEW PASSWORD AND PREVIOUS PASSWORD ARE THE SAME
  if (matchPreviousPassword) {
    // SEND ERROR
    return res.render("password-change", {
      message: "Do not use your previous password"
    });
  }


  // HASH NEW PASSWORD
  bcrypt.hash(newPassword, Number(process.env.SALT_ROUNDS), (err, hashed) => {
    User.findOneAndUpdate({_id: userId}, {$set: {password: hashed}}, (err, result) => {
      if (!result) {
        res.status(404).json({
          message: err
        });
      } else {
        // DELETE THE TOKEN
        resetPasswordToken.deleteOne();
        res.render("successfully-change-password");
      }
    })
  });
}


// FUNCTION : GET LOGIN PAGE
export const getLoginPage = async (req, res) => {
  return res.render("login", {
    message: "",
    inputBox: {
      username: "",
      password: ""
    }
  });
}


// FUNCTION : GET REGISTER PAGE
export const getRegisterPage = async (req, res) => {
  return res.render("register", {
    message: "",
    inputBox: {
      username: "",
      password: "",
      displayName: "",
      email: ""
    }
  });
}


// FUNCTION : GET VERIFY USER PAGE (6-DIGIT VERIFICATION)
export const getVerifyUserPage = async (req, res) => {

  const {token} = req.query;

  // CHECK TOKEN
  if (!token) {
    // NO TOKEN IN QUERY
    return res.redirect("/login");
  }

  // FIND TOKEN IN DATABASE
  // to check if token is valid (available)
  const validateUserToken = await Token.findOne({token,tokenType: "validate-user"});

  // TOKEN IS INVALID (EXPIRED)
  if (!validateUserToken) {
    // EXPIRED
    return res.render("auth-error", {
      message: "Token has expires"
    });
  }

  // RENDER VERIFY USER PAGE TO USER
  return res.render("verify-user", {
    message: "",
    inputBox: {
      pin: ""
    }
  });
}

// FUNCTION : GET FORGOT PASSWORD PAGE
export const getForgotPasswordPage = async (req, res) => {
  return res.render("password-reset", {
    message: ""
  });
}

// FUNCTION : GET GOOGLE AUTH ERROR PAGE
export const getGoogleAuthErrorPage = async (req, res) => {
  return res.render("auth-error", {
    message : "That gmail has been used. Please use another one."
  })
}

// FUNCTION : GET RESET FUNCTION PAGE
export const getResetPasswordPage = async (req, res) => {

  const {token,id: userId} = req.query;

  // NO TOKEN OR NO USER ID IS ATTACHED ON THE QUERY
  if (!token || !userId) {
    return res.redirect("/login");
  }

  // FIND TOKEN
  // to make sure token is valid (available)
  const resetPasswordToken = await Token.findOne({token,userId});

  // NO TOKEN AVAILABLE (Token has expires)
  if (!resetPasswordToken) {
    return res.render("auth-error", {
      message: "Token has expired"
    })
  }

  // FIND USER BY ID
  // to make sure user is valid (available)
  const user = await User.findOne({_id: userId});

  // NO USER WITH THAT ID (UNAVAILABLE)
  if (!user) {
    return res.status(404).json("No user with id");
  }

  res.render("password-change", {
    message: ""
  });
}


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= PERMISSION CONTROLLER =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

// FUNCTION : AUTHENTHICATED USER
// to check the user has signed-in or not
export const isAuth = async (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    return res.redirect("/login");
  }
}

// FUNCTION : ADMIN USER
// to check whether the user is admin or not
export const isAdmin = async (req, res, next) => {
  if (req.session.isAdmin) {
    next();
  } else {
    return res.status(404).json({
      message: "Access denied"
    });
  }
}


// FUNCTION : GET ADMIN PAGE
export const getAdminPage = async (req, res, next) => {

  const allMusic = await Music.find({});

  allMusic.sort((a, b) => {
    if (a.title > b.title) return 1;
    if (a.title < b.title) return -1;
    if (a.title === b.title) {
      if (a.singer > b.singer) return 1;
      if (a.singer < b.singer) return -1;
      return 0;
    }
  });

  res.render("admin", {
    data: allMusic,
    page: "admin",
    isAuth: req.session.isAuth,
    isAdmin: req.session.isAdmin,
  });
}
