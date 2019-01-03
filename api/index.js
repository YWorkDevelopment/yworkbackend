import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import request from "request";
import nodemailer from "nodemailer";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ origin: "https://ywork.now.sh" }));

const Mailer = nodemailer.createTransport({
  service: "gmail",
  secure: false,
  auth: {
    user: "ywork.dev@gmail.com",
    pass: process.env.EMAIL_TOKEN
  },
  tls: {
    rejectUnauthorized: false
  }
});

const Headers = {
  from: "YWork Server <ywork.dev@gmail.com>",
  to: "ywork@gmx.ch",
  subject: "YWork Kontaktanfrage"
};

app.post("*", (req, res) => {
  if (
    req.body.captcha === undefined ||
    req.body.captcha === "" ||
    req.body.captcha === null
  )
    return res.json({ success: false, ycode: "NOCAPTCHA" });

  const secretKey = process.env.CAPTCHA_SECRET;
  const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${
    req.body.captcha
  }&remoteip=${req.connection.remoteAddress}`;

  request(verifyURL, (err, req, body) => {
    body = JSON.parse(body);

    if (body.success !== undefined && !body.success)
      return res.json({ success: false, code: "NOSUCCESS" });

    const Mail = { ...Headers, text: req.query.mail };

    Mailer.sendMail(Mail, (error, info) => {
      if (error) return res.json({ success: false, code: "NOMAIL", error });

      res.json({ success: true, info });
    });
  });
});

app.listen();
