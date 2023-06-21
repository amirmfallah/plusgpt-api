const File = require("../models/File");
const { from, reduce, concatMap, scan, tap, switchMap } = require("rxjs");
const openAi = require("../server/services/openAI.service");

// const test = async () => {
//   console.log("hello");
//   const file = await File.File.findOne({});
//   const chunks = file.chunks;
//   console.log(chunks.length);
//   rsjx
//     .from(chunks)
//     .pipe(rsjx.concatMap((x) => rsjx.of(x).pipe(rsjx.delay(1000))))
//     .subscribe(console.log);
// };

const retry = async (fn, { retries, retryIntervalMs }, args) => {
  try {
    return await fn(args);
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    await sleep(retryIntervalMs);
    return retry(fn, { retries: retries - 1, retryIntervalMs });
  }
};

const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const test = async () => {
  const file = await File.File.findOne({});
  const chunks = file.chunks;
  const options = { retries: 2, retryIntervalMs: 200 };

  let conversationId = undefined;
  let parrentMessageId = undefined;
  for (let i = 0; i < chunks.length; i++) {
    const result = await retry(openAi, options, {
      text: chunks[i],
      user: "64774095689d1c434e422ee6",
      endpoint: "openAI",
      conversationId: conversationId,
      parentMessageId: parrentMessageId,
    });
    console.log("###################");
    console.log(result);
    conversationId = result.conversation.conversationId;
    parrentMessageId = result.responseMessage.newMessageId;
  }
};

// test();
