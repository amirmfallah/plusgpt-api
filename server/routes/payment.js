const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { verifyTransaction } = require("../services/payment.service");
const { updateSubscriptionById } = require("../../models/Subscription");
const requireJwtAuth = require("../../middleware/requireJwtAuth");
const { buySubscription } = require("../services/subscription.service");
const _ = require("lodash");
const sendSMS = require("../../utils/sendSMS");

const callbackSchema = Joi.object({
  trans_id: Joi.string().required(),
  order_id: Joi.string().required(),
  amount: Joi.number().required(),
}).unknown(true);

const buySchema = Joi.object({
  product_id: Joi.string().required(),
});

router.get("/callback", async (req, res) => {
  try {
    const value = await callbackSchema.validateAsync(req.query);
    const invoice = await verifyTransaction(value.trans_id, value.amount);
    const sub = await updateSubscriptionById(value.order_id, {
      active: true,
      invoice: invoice,
    });
    console.log(sub);
    await sendSMS(sub.user.phone, "./sms/receipt.handlebars", {
      name: sub.user.name,
      code: invoice.Shaparak_Ref_Id,
    });
  } catch (e) {
    console.log(e);
    const code = _.get(e, "data.code") ? _.get(e, "data.code") : "500";
    res.redirect(`https://app.plusgpt.ir/plans/callback?code=${code}`);
    return;
  }
  res.redirect("https://app.plusgpt.ir");
});

router.post("/buy", requireJwtAuth, async (req, res) => {
  const user = req.user.id;
  try {
    const value = await buySchema.validateAsync(req.body);
    const uri = await buySubscription(user, value.product_id);
    res.status(200).json(uri);
  } catch (e) {
    console.log(e);
    res.status(500).json(e);
  }
});

module.exports = router;
