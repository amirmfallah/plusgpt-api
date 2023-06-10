const express = require("express");
const s3Service = require("../services/s3.service");
const Joi = require("joi");
const router = express.Router();
const pdf = require("pdf-parse");
const { newFile, updateFile } = require("../../models");
const filePrompt = require("../../static/filePrompt");
const axios = require("axios");
const requireJwtAuth = require("../../middleware/requireJwtAuth");
const openAi = require("../services/openAI.service");
const rsjx = require("rxjs");
const PROMPT_LIMIT = 10000;

const urlSchema = Joi.object({
  contentType: Joi.string().required(),
  key: Joi.string().required(),
});

router.post("/process", requireJwtAuth, async (req, res) => {
  var file;
  try {
    const object = await s3Service.keyExists(req.body.key);
    if (object.KeyCount == 0) {
      res.sendStatus(404);
      return;
    }
    file = await newFile({
      key: req.body.key,
      processed: false,
    });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }

  s3Service.getObject(req.body.key).then(async (object) => {
    const doc = await pdf(object.Body);
    const body = doc.text;
    const chunks_count = parseInt(body.length / PROMPT_LIMIT);
    var chunks = [];

    chunks.push(filePrompt.startPrompt(chunks_count + 1));

    for (let i = 0; i <= chunks_count; i++) {
      const end = Math.min((i + 1) * PROMPT_LIMIT, body.length - 1);
      const slice = body.slice(i * PROMPT_LIMIT, end);

      if (i == chunks_count) {
        chunks.push(filePrompt.endPrompt(chunks_count + 1, slice));
        continue;
      }

      chunks.push(filePrompt.midPrompt(i, chunks_count + 1, slice));
    }

    await updateFile(
      { _id: file._id },
      {
        chunks: chunks,
        processed: true,
        chars: body.length,
      }
    );

    // const firstPromot = await openAi({
    //   text: chunks[0],
    //   user: req.user.id,
    //   endpoint: "openAI",
    // });
    // await openAi({
    //   text: chunks[i],
    //   user: req.user.id,
    //   endpoint: "openAI",
    //   conversationId: firstPromot.conversation.conversationId,
    // });
    // await openAi({
    //   text: chunks[i],
    //   user: req.user.id,
    //   endpoint: "openAI",
    //   conversationId: firstPromot.conversation.conversationId,
    // });
  });

  res.sendStatus(202);
});

module.exports = router;
