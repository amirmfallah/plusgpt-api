const express = require("express");
const s3Service = require("../services/s3.service");
const Joi = require("joi");
const router = express.Router();
const crypto = require("crypto");
const requireJwtAuth = require("../../middleware/requireJwtAuth");
const { hasActiveSubscription } = require("../services/subscription.service");

const urlSchema = Joi.object({
  contentType: Joi.string().required(),
});

router.post("/sign_url", requireJwtAuth, async (req, res) => {
  try {
    const user = req?.user?._id.toString();
    const sub = await hasActiveSubscription(user);
    if (!sub) {
      throw new Error("usage_exceeded");
    }
  } catch (error) {
    console.log(error);
    res.status(401).send({ message: error });
    return;
  }

  try {
    key = `${crypto.randomUUID()}.pdf`;
    const value = await urlSchema.validateAsync(req.body);
    const url = await s3Service.getUploadURL(value.contentType, key);
    res.send(url).status(200);
    return;
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

module.exports = router;
