const {
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyUserPhone,
} = require("../services/auth.service");
const { getActiveSubscription } = require("../services/subscription.service");
const generateOTP = require("../../utils/generateOTP");
const { newOTP, verifyOTP, pendingOTP } = require("../../models");
const sendSMS = require("../../utils/sendSMS");
const isProduction = process.env.NODE_ENV === "production";

const loginController = async (req, res) => {
  try {
    const token = req.user.generateToken();
    const user = await loginUser(req.user);
    if (user) {
      // res.cookie("token", token, {
      //   expires: new Date(Date.now() + eval(process.env.SESSION_EXPIRY)),
      //   httpOnly: false,
      //   secure: isProduction,
      // });
      res.status(200).send({ token, user });
    } else {
      return res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

const logoutController = async (req, res) => {
  const { signedCookies = {} } = req;
  const { refreshToken } = signedCookies;
  try {
    const logout = await logoutUser(req.user, refreshToken);
    console.log(logout);
    const { status, message } = logout;
    if (status === 200) {
      // res.clearCookie("token");
      // res.clearCookie("refreshToken");
      res.status(status).send({ message });
    } else {
      res.status(status).send({ message });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

const registrationController = async (req, res) => {
  try {
    const response = await registerUser(req.body);
    if (response.status === 200) {
      const { status, user } = response;
      const token = user.generateToken();
      //send token for automatic login
      // res.cookie("token", token, {
      //   expires: new Date(Date.now() + eval(process.env.SESSION_EXPIRY)),
      //   httpOnly: false,
      //   secure: isProduction,
      // });
      res.status(status).send({ user, token });
    } else {
      const { status, message } = response;
      res.status(status).send({ message });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

const getUserController = async (req, res) => {
  const activePlan = await getActiveSubscription(req.user.id);
  var user = req.user.toJSON();
  if (activePlan) {
    user["plan"] = {
      active: true,
      limit: activePlan.product.amount,
      used: activePlan.current_usage,
    };
  } else {
    user["plan"] = {
      active: false,
      limit: 0,
      used: 0,
    };
  }
  return res.status(200).send(user);
};

const resetPasswordRequestController = async (req, res) => {
  try {
    const resetService = await requestPasswordReset(req.body.email);
    if (resetService.link) {
      return res.status(200).json({ message: resetService.message });
    } else {
      return res.status(400).json(resetService);
    }
  } catch (e) {
    console.log(e);
    return res.status(400).json({ message: e.message });
  }
};

const resetPasswordController = async (req, res) => {
  try {
    const resetPasswordService = await resetPassword(
      req.body.userId,
      req.body.token,
      req.body.password
    );
    if (resetPasswordService instanceof Error) {
      return res.status(400).json(resetPasswordService);
    } else {
      return res.status(200).json(resetPasswordService);
    }
  } catch (e) {
    console.log(e);
    return res.status(400).json({ message: e.message });
  }
};

const refreshController = async (req, res, next) => {
  const { signedCookies = {} } = req;
  const { refreshToken } = signedCookies;
  //TODO
  // if (refreshToken) {
  //   try {
  //     const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  //     const userId = payload._id;
  //     User.findOne({ _id: userId }).then(
  //       (user) => {
  //         if (user) {
  //           // Find the refresh token against the user record in database
  //           const tokenIndex = user.refreshToken.findIndex(item => item.refreshToken === refreshToken);

  //           if (tokenIndex === -1) {
  //             res.statusCode = 401;
  //             res.send('Unauthorized');
  //           } else {
  //             const token = req.user.generateToken();
  //             // If the refresh token exists, then create new one and replace it.
  //             const newRefreshToken = req.user.generateRefreshToken();
  //             user.refreshToken[tokenIndex] = { refreshToken: newRefreshToken };
  //             user.save((err) => {
  //               if (err) {
  //                 res.statusCode = 500;
  //                 res.send(err);
  //               } else {
  //               //  setTokenCookie(res, newRefreshToken);
  //                 const user = req.user.toJSON();
  //                 res.status(200).send({ token, user });
  //               }
  //             });
  //           }
  //         } else {
  //           res.statusCode = 401;
  //           res.send('Unauthorized');
  //         }
  //       },
  //       err => next(err)
  //     );
  //   } catch (err) {
  //     res.statusCode = 401;
  //     res.send('Unauthorized');
  //   }
  // } else {
  //   res.statusCode = 401;
  //   res.send('Unauthorized');
  // }
};

const requestOtpController = async (req, res, next) => {
  try {
    if (await pendingOTP(req.user?.phone)) {
      res.status(400).json({ message: "pending otp" });
      return;
    }
    const code = generateOTP(5);
    const otp = await newOTP(req.user?.phone, code);
    await sendSMS(req.user?.phone, "./sms/verification.handlebars", {
      name: req.user?.name,
      code: code,
    });
    if (otp) {
      res.status(200).send({});
    } else {
      return res.status(400).json({ message: "Invalid phone" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

const verifyOtpController = async (req, res, next) => {
  try {
    const otp = await verifyOTP(req.user?.phone, req.body?.code);
    if (otp) {
      await verifyUserPhone(req.user?.phone);
      res.status(200).send(otp);
    } else {
      return res.status(404).json({ message: "Invalid phone or code" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getUserController,
  loginController,
  logoutController,
  refreshController,
  registrationController,
  resetPasswordRequestController,
  resetPasswordController,
  requestOtpController,
  verifyOtpController,
};
