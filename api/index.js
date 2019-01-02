import express from "express";
import nodemailer from "nodemailer";

const app = express();

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

app.get("*", (req, res) => {
  const Mail = { ...Headers, text: req.query.mail };

  Mailer.sendMail(Mail, (error, info) => {
    if (error) {
      res.send(JSON.stringify(error));
      return;
    }

    res.send(JSON.stringify(info));
  });
});

app.listen();
