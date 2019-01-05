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
  const captcha = req.body.captcha;
  const mail = req.body.mail;

  if (captcha === undefined || captcha === "" || captcha === null)
    return res.json({ success: false, code: "NOCAPTCHA" });

  const secretKey = process.env.CAPTCHA_SECRET;
  const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${
    req.connection.remoteAddress
  }`;

  request(verifyURL, (err, req, body) => {
    body = JSON.parse(body);

    if (body.success !== undefined && !body.success)
      return res.json({ success: false, code: "NOSUCCESS", body });

    const Mail = { ...Headers, text: mail };

    Mailer.sendMail(Mail, (error, info) => {
      if (error) return res.json({ success: false, code: "NOMAIL", error });

      res.json({ success: true, info });
    });
  });
});

app.listen();
