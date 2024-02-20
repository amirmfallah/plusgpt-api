const express = require("express");
const s3Service = require("../services/s3.service");
const Joi = require("joi");
const router = express.Router();
const pdf = require("pdf-parse");
const { newFile, updateFile, getConvo } = require("../../models");
const filePrompt = require("../../static/filePrompt");
const axios = require("axios");
const requireJwtAuth = require("../../middleware/requireJwtAuth");
const openAi = require("../services/openAI.service");
const rsjx = require("rxjs");
const { getFile } = require("../../models/File");
const PROMPT_LIMIT = 9000;

const urlSchema = Joi.object({
  contentType: Joi.string().required(),
  key: Joi.string().required(),
});

router.get("/process/status", requireJwtAuth, async (req, res) => {
  const key = req.query?.key;
  if (!key) {
    res.status(400).send();
    return;
  }

  const file = await getFile({ key });
  if (!file) {
    res.status(404).send();
  }

  let conversation = undefined;
  if (file.conversationId) {
    conversation = await getConvo(req.user?.id, file.conversationId);
  }

  res.status(200).send({
    processed: file.processed,
    error: file.error,
    conversationId: file.conversationId || undefined,
    conversation: conversation,
  });
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

  try {
    s3Service
      .getObject(req.body.key)
      .then(async (object) => {
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
        const options = { retries: 2, retryIntervalMs: 20000 };
        let conversationId = undefined;
        let parrentMessageId = undefined;

        for (let i = 0; i < chunks.length; i++) {
          try {
            const result = await retry(openAi, options, {
              text: chunks[i],
              user: req.user.id,
              endpoint: "openAI",
              conversationId: conversationId,
              parentMessageId: parrentMessageId,
            });
            conversationId = result?.conversation?.conversationId;
            parrentMessageId = result?.responseMessage?.newMessageId;
          } catch (error) {
            await updateFile(
              { _id: file._id },
              {
                processed: false,
                error: true,
              }
            );
            throw error;
          }
        }

        await updateFile(
          { _id: file._id },
          {
            chunks: chunks,
            processed: true,
            chars: body.length,
            conversationId: conversationId,
          }
        );
      })
      .catch((e) => {
        throw e;
      });

    res.sendStatus(202);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

const retry = async (fn, { retries, retryIntervalMs }, args) => {
  try {
    console.log("sending req");
    const data = await fn(args);
    return data;
  } catch (error) {
    console.log("error req");
    if (retries <= 0) {
      throw error;
    }
    console.log("waiting");
    await waitFor(20000);
    return retry(fn, { retries: retries - 1, retryIntervalMs }, args);
  }
};

function waitFor(millSeconds) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, millSeconds);
  });
}
module.exports = router;
