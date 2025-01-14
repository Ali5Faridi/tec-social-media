import { validationResult } from "express-validator";
import userModel from "./../models/userModel.js";
import sendVerificationEmail from "../utilities/mailer.js";
import jwt from "jsonwebtoken";


class UserController {
  constructor(){}

  // login
   async auth(req, res) {
    const cookies = req.cookies;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });  
    }
    const { email, password } = req.body;

    const user = await userModel.findOne({ email});

    if(!foundUser) return res.status(401);

    if(!foundUser.comparePassword(password)) {
      return res.sendStatus(401);
    }
    const accessToken = jwt.sign(
      {id:foundUser._id},
       process.env.ACCESS_TOKEN_SECRET,
       {expiresIn: '15m'}
      );

      const newRefreshToken = jwt.sign(
        {id: foundUser._id},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: '7d'}
        );

        let newRefreshTokenArray = !cookies?.jwt 
        ? foundUser.refreshToken :
         foundUser.refreshToken.filter(rt => rt !== cookies.jwt);

         if(!cookies.jwt){
           const refreshToken = cookies.jwt;
           const foundToken = await userModel.findOne({refreshToken});
           if(!foundToken) {
            newRefreshTokenArray = [];
           }
   res.clearCookie("jwt" , {
      httpOnly: true,
      sameSite: "none",
      secure: 'true',
   });
    }
   foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
    await foundUser.save();

    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: 'true',
       maxAge: 604800000, // 7 days
    });

    const userInfo = {
      first_name: foundUser.first_name,
       last_name: foundUser.last_name,
       email: foundUser.email, 
       username: foundUser.username, 
       profile_picture: foundUser.profile_picture,
       username: foundUser.username,
      };
      res.json({accessToken, userInfo});
  }

  // register

  async register(req, res) {
   try{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const newUser = await userModel({
     ...req.body,
     username: req.body.user_name + req.body.last_name,
    }).save();

    const mailVerificationLink = jwt.sign(
      {id:newUser._id.toString()},
       process.env.MAIL_JWT_TOKEN,
        {expiresIn: '30m'}
      );
      const url = `${process.env.BASE_URL}activate/${mailVerificationLink}`;
      sendVerificationEmail(newUser.email, newUser.first_name, url);

      res.json({message:"new user created successfully"});

   }catch(error){
    res.status(500).json({message:error.message});
    
   }
  }

  // verify account with token

  async activateAccount(req, res) {
    const {token} =req.body;
    if(!token) return res.status(400).json({message:"Invalid token"});

 
    const user = jwt.verify(token, process.env.MAIL_JWT_TOKEN);
    if(!user) return res.status(400).json({message:"Invalid token"});

    const foundUser = await userModel.findById(user.id);
    if(!foundUser) return res.status(400).json({message:"Invalid token"});

    if(foundUser.verified === true){
      return res.status(400).json({message:"Account already verified"});
    } else{
      await userModel.findByIdAndUpdate(user.id, {verified:true});
      return res.status(200).json({message:"Account verified successfully"});
    }
}
}

export default new UserController();
