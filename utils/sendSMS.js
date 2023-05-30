const MelipayamakApi = require("melipayamak-api");

module.exports = (to, from, text) => {
  const username = process.env.SMS_USERNAME;
  const password = process.env.SMS_PASSWORD;
  const api = new MelipayamakApi(username, password);
  const sms = api.sms();
  sms
    .send(to, from, text)
    .then((res) => {
      return res;
    })
    .catch((err) => {
      console.log(err);
      return err;
    });
};
