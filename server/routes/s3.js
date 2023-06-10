const express = require("express");
const s3Service = require("../services/s3.service");
const Joi = require("joi");
const router = express.Router();

const urlSchema = Joi.object({
  contentType: Joi.string().required(),
  key: Joi.string().required(),
});

router.post("/sign_url", async (req, res) => {
  try {
    const value = await urlSchema.validateAsync(req.body);
    const url = await s3Service.getUploadURL(value.contentType, value.key);
    res.send(url).status(200);
    return;
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

module.exports = router;
