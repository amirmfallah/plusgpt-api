const MelipayamakApi = require("melipayamak");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

module.exports = async (to, template, data) => {
  const username = process.env.SMS_USERNAME;
  const password = process.env.SMS_PASSWORD;
  const from = "50004001475534";
  const api = new MelipayamakApi(username, password);
  const sms = api.sms();

  const source = await fs.readFileSync(path.join(__dirname, template), "utf8");
  const compiledTemplate = handlebars.compile(source);

  sms
    .send(to, from, compiledTemplate(data))
    .then((res) => {
      return res;
    })
    .catch((err) => {
      console.log(err);
      return err;
    });
};
