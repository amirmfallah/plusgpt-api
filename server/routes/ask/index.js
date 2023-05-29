const express = require('express');
const router = express.Router();
// const askAzureOpenAI = require('./askAzureOpenAI';)
const askOpenAI = require('./askOpenAI');
const askGoogle = require('./askGoogle');
const askBingAI = require('./askBingAI');
const askChatGPTBrowser = require('./askChatGPTBrowser');
const requireJwtAuth = require('../../../middleware/requireJwtAuth');

// router.use('/azureOpenAI', askAzureOpenAI);
router.use('/openAI', requireJwtAuth, askOpenAI);
router.use('/google', askGoogle);
router.use('/bingAI', askBingAI);
router.use('/chatGPTBrowser', askChatGPTBrowser);

module.exports = router;
