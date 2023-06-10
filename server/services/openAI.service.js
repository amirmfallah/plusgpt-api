const { askClient, titleConvo } = require("../../app");
const {
  saveMessage,
  saveConvo,
  getConvoTitle,
  getConvo,
} = require("../../models");
const { sendMessage, handleText } = require("../routes/ask/handlers");
const { getOpenAIModels } = require("../routes/endpoints");
const { hasActiveSubscription, incUsage } = require("./subscription.service");
const crypto = require("crypto");

module.exports = async (params) => {
  const {
    endpoint,
    text,
    overrideParentMessageId = null,
    parentMessageId,
    conversationId: oldConversationId,
    user,
  } = params;
  if (text.length === 0) throw new Error("Prompt empty or too short");
  if (endpoint !== "openAI") throw new Error("Illegal request");

  // build user message
  const conversationId = oldConversationId || crypto.randomUUID();
  const isNewConversation = !oldConversationId;
  const userMessageId = crypto.randomUUID();
  const userParentMessageId =
    parentMessageId || "00000000-0000-0000-0000-000000000000";
  const userMessage = {
    messageId: userMessageId,
    sender: "User",
    text,
    parentMessageId: userParentMessageId,
    conversationId,
    isCreatedByUser: true,
  };

  // build endpoint option
  const endpointOption = {
    model: params?.model ?? "gpt-3.5-turbo",
    chatGptLabel: params?.chatGptLabel ?? null,
    promptPrefix: params?.promptPrefix ?? null,
    temperature: params?.temperature ?? 1,
    top_p: params?.top_p ?? 1,
    presence_penalty: params?.presence_penalty ?? 0,
    frequency_penalty: params?.frequency_penalty ?? 0,
  };

  const availableModels = getOpenAIModels();
  if (
    availableModels.find((model) => model === endpointOption.model) ===
    undefined
  )
    throw new Error({ text: "Illegal request: model" });

  console.log("ask log", {
    userMessage,
    endpointOption,
    conversationId,
  });

  if (!overrideParentMessageId) {
    await saveMessage(userMessage);
    await saveConvo(user, {
      ...userMessage,
      ...endpointOption,
      conversationId,
      endpoint,
    });
  }

  // eslint-disable-next-line no-use-before-define
  return await ask({
    isNewConversation,
    userMessage,
    endpointOption,
    conversationId,
    preSendRequest: true,
    overrideParentMessageId,
    user,
  });
};

const ask = async ({
  isNewConversation,
  userMessage,
  endpointOption,
  conversationId,
  preSendRequest = true,
  overrideParentMessageId = null,
  user,
}) => {
  let {
    text,
    parentMessageId: userParentMessageId,
    messageId: userMessageId,
  } = userMessage;
  const userId = user;
  let responseMessageId = crypto.randomUUID();

  try {
    console.log(user);
    const sub = await hasActiveSubscription(user);
    if (!sub) {
      throw new Error("usage_exceeded");
    }

    saveMessage({
      messageId: responseMessageId,
      sender: endpointOption?.chatGptLabel || "ChatGPT",
      conversationId,
      parentMessageId: overrideParentMessageId || userMessageId,
      text: text,
      unfinished: true,
      cancelled: false,
      error: false,
    });

    const oaiApiKey = null;

    let response = await askClient({
      text,
      parentMessageId: userParentMessageId,
      conversationId,
      oaiApiKey,
      ...endpointOption,
      userId,
    });

    console.log("CLIENT RESPONSE", response);

    const newConversationId = response.conversationId || conversationId;
    const newUserMassageId = response.parentMessageId || userMessageId;
    const newResponseMessageId = response.messageId;

    // STEP1 generate response message
    response.text = response.response || "**ChatGPT refused to answer.**";

    let responseMessage = {
      conversationId: newConversationId,
      messageId: responseMessageId,
      newMessageId: newResponseMessageId,
      parentMessageId: overrideParentMessageId || newUserMassageId,
      text: await handleText(response),
      sender: endpointOption?.chatGptLabel || "ChatGPT",
      unfinished: false,
      cancelled: false,
      error: false,
    };

    await saveMessage(responseMessage);
    responseMessage.messageId = newResponseMessageId;

    // STEP2 update the conversation
    let conversationUpdate = {
      conversationId: newConversationId,
      endpoint: "openAI",
    };
    if (conversationId != newConversationId)
      if (isNewConversation) {
        // change the conversationId to new one
        conversationUpdate = {
          ...conversationUpdate,
          conversationId: conversationId,
          newConversationId: newConversationId,
        };
      } else {
        // create new conversation
        conversationUpdate = {
          ...conversationUpdate,
          ...endpointOption,
        };
      }

    await saveConvo(user, conversationUpdate);
    conversationId = newConversationId;

    // STEP3 update the user message
    userMessage.conversationId = newConversationId;
    userMessage.messageId = newUserMassageId;

    // If response has parentMessageId, the fake userMessage.messageId should be updated to the real one.
    if (!overrideParentMessageId)
      await saveMessage({
        ...userMessage,
        messageId: userMessageId,
        newMessageId: newUserMassageId,
      });
    userMessageId = newUserMassageId;

    if (userParentMessageId == "00000000-0000-0000-0000-000000000000") {
      const title = await titleConvo({
        endpoint: endpointOption?.endpoint,
        text,
        response: responseMessage,
        oaiApiKey,
      });
      await saveConvo(user, {
        conversationId: conversationId,
        title,
      });
    }
    await incUsage(user, response.usage.total_tokens);

    return {
      title: await getConvoTitle(user, conversationId),
      final: true,
      conversation: await getConvo(user, conversationId),
      requestMessage: userMessage,
      responseMessage: responseMessage,
    };
  } catch (error) {
    console.error(error);
    const errorMessage = {
      messageId: responseMessageId,
      sender: endpointOption?.chatGptLabel || "ChatGPT",
      conversationId,
      parentMessageId: overrideParentMessageId || userMessageId,
      unfinished: false,
      cancelled: false,
      error: true,
      text: error.message,
    };
    await saveMessage(errorMessage);
    return errorMessage;
  }
};
