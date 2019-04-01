import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import request from "request";
import nodemailer from "nodemailer";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ origin: "https://www.ywork.ch" }));

const {
  CAPTCHA_SECRET,
  OAUTH_CLIENTID,
  OAUTH_CLIENTSECRET,
  OAUTH_REFRESHTOKEN,
  OAUTH_ACCESSTOKEN
} = process.env;

const OAuth2 = {
  type: "OAuth2",
  user: "ywork.dev@gmail.com",
  clientId: OAUTH_CLIENTID,
  clientSecret: OAUTH_CLIENTSECRET,
  refreshToken: OAUTH_REFRESHTOKEN,
  accessToken: OAUTH_ACCESSTOKEN,
  expires: 3600
};

const Mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: OAuth2
});

app.post("*", (req, res) => {
  const captcha = req.body.captcha;
  const form = req.body.form;

  const Headers = {
    from: "Y-Work Server <ywork.dev@gmail.com>",
    to: "ywork@gmx.ch",
    cc: "ywork.dev@gmail.com",
    subject: `Y-Work Kontaktanfrage <${form.mail}>`
  };

  if (captcha === undefined || captcha === "" || captcha === null)
    return res.json({ success: false, code: "NOCAPTCHA" });

  const secretKey = CAPTCHA_SECRET;
  const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${
    req.connection.remoteAddress
  }`;

  request(verifyURL, (err, req, body) => {
    body = JSON.parse(body);

    if (body.success !== undefined && !body.success)
      return res.json({ success: false, code: "NOSUCCESS", body });

    const html = form.isGiver
      ? `<h1 style="margin-bottom: 0;">Arbeitgeber</h1>
      <div>${form.name} ${form.surname}</div>
      <div>${form.mail}</div>

      <br>

      <div><b>Addresse</b><br>${form.address}</div>
      <div><b>Zeit</b><br>${form.time}</div>
      <div><b>Frist</b><br>${form.deadline}</div>
      <div><b>Beschreibung</b><br>${form.work.replace(/\n/g, "<br>")}</div>
    `
      : `<h1 style="margin-bottom: 0;">Arbeitnehmer</h1>
      <div>${form.name} ${form.surname} <b>${form.age}</b></div>
      <div>${form.mail}</div>

      <br>

      <div><b>Zeit</b><br>${form.time}</div>
      <div><b>Mögliche Arbeiten</b><br>${form.works.replace(
        /\n/g,
        "<br>"
      )}</div>
      <div><b>Mögliche Orte</b><br>${form.places.replace(/\n/g, "<br>")}</div>
    `;

    const Mail = { ...Headers, html };

    Mailer.sendMail(Mail, (error, info) => {
      if (error) return res.json({ success: false, code: "NOMAIL", error });

      res.json({ success: true, info });
    });
  });
});

app.listen();
