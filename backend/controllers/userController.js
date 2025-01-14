import { validationResult } from "express-validator";
import userModel from "./../models/userModel.js";
import sendVerificationEmail from "../utilities/mailer.js";
import jwt from "jsonwebtoken";

class UserController {
  constructor() {}

  // login
  async auth(req, res) {
    const cookies = req.cookies;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!foundUser) return res.status(401);

    if (!foundUser.comparePassword(password)) {
      return res.sendStatus(401);
    }
    const accessToken = jwt.sign(
      { id: foundUser._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { id: foundUser._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    let newRefreshTokenArray = !cookies?.jwt
      ? foundUser.refreshToken
      : foundUser.refreshToken.filter((rt) => rt !== cookies.jwt);

    if (!cookies.jwt) {
      const refreshToken = cookies.jwt;
      const foundToken = await userModel.findOne({ refreshToken });
      if (!foundToken) {
        newRefreshTokenArray = [];
      }
      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "none",
        secure: "true",
      });
    }
    foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
    await foundUser.save();

    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: "true",
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
    res.json({ accessToken, userInfo });
  }

  // register

  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const newUser = await userModel({
        ...req.body,
        username: req.body.user_name + req.body.last_name,
      }).save();

      const mailVerificationLink = jwt.sign(
        { id: newUser._id.toString() },
        process.env.MAIL_JWT_TOKEN,
        { expiresIn: "30m" }
      );
      const url = `${process.env.BASE_URL}user/activate/${mailVerificationLink}`;
      sendVerificationEmail(newUser.email, newUser.first_name, url);

      res.json({ message: "new user created successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // verify account with token

  async activateAccount(req, res) {

    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "token not valid" });

    const user = jwt.verify(
      token,
      process.env.MAIL_JWT_TOKEN,

      async (err, user) => {
        if (err) {
          return res.status(400).json({ message: "Invalid token" });
        }
        const foundUser = await UserModel.findById(user.id);
        if (!foundUser)
          return res.status(400).json({ message: "Invalid token" });

        if (foundUser.id !== req.userId)
          return res.status(403).json({ message: "invalid token" });

        if (foundUser.verified == true) {
          return res
            .status(400)
            .json({ message: "this email is already activated" });
        } else {
          await UserModel.findByIdAndUpdate(user.id, { verified: true });
          return res
            .status(200)
            .json({ message: "Account has been activated successfully" });
        }
      });
  }


  //refresh token

  async refreshToken(req, res) {
    const cookies = req.cookies;

    if (!cookies?.jwt) return res.sendStatus(401);

    const refreshToken = cookies.jwt;
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });

    const foundUser = await UserModel.findOne({ refreshToken });

    if (!foundUser) {
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
          if (err) return;

          const hackedUser = await UserModel.findOne({ id: decoded.id });

          if (hackedUser) {
            hackedUser.refreshToken = [];
            await hackedUser.save();
          }
        }
      );

      return res.sendStatus(403);
    }

    const newRefreshTokenArray = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          foundUser.refreshToken = [...newRefreshTokenArray];
          await foundUser.save();
        }

        if (err || foundUser.id !== decoded.id) return res.sendStatus(403);

        const accessToken = jwt.sign(
          { id: decoded.id },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "5m" }
        );

        const newRefreshToken = jwt.sign(
          { id: foundUser.id },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: "15d" }
        );

        foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];

        await foundUser.save();

        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "None",
          maxAge: 604800000, // 7 days
        });

        const userInfo = {
          first_name: foundUser.first_name,
          last_name: foundUser.last_name,
          picture: foundUser.picture,
          username: foundUser.username,
          verified: foundUser.verified,
        };
        res.json({ accessToken, userInfo });
      }
    );
  }
}

export default new UserController();
