const express = require("express");
const Router = express.Router();
const User = require("../model/user");
const validate_user_mail = require("../validations/validate_user_mail");
const genToken = require("../token/genToken");
const Recover_password = require("../model/recover-password");

const {
  create_mail_options,
  transporter,
} = require("../mailer/recover-password");

Router.post("/", async (req, res) => {
  console.log(req.body)
  const request_isvalid = validate_user_mail(req.body);
  if (request_isvalid != true)
    return res.status(400).json({ error: true, errMessage: request_isvalid });

  try {
    const user = await User.findOne({ Email: req.body.Email });
    console.log("user exist", user);
    if (!user)
      return res
        .status(200)
        .json({ error: false, message: "Recovery Email successfully sent" });

    let token = genToken(user._id);
    let Email= req.body.Email;
    let reset_link = `https://blockchaininternationalexchang.herokuapp.com/change-password.html?${token}?${Email}`;

    const recover_password = await new Recover_password({
      user: user._id,
      reset_token: `${token}?${Email}`,
    });
    await recover_password.save();

    transporter.sendMail(
      create_mail_options({
        reciever: user.Email,
        Name: user.Name,
        // last_name: user.last_name,
        reset_link,
      }),
      (err, info) => {
        if (err) return console.log(err.message);
        console.log(info);
        // return res.status(400).json({
        //   error: true,
        //   errMessage: `Encounterd an error while trying to send an email to you: ${err.message}, try again`,
        // });
      },
    );
    res
      .status(200)
      .json({ error: false, message: "Recovery Email successfully sent" });
  } catch (error) {
    res.status(400).json({ error: true, errMessage: error.message });
  }
});
module.exports = Router;
