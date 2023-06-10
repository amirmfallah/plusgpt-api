module.exports = {
  startPrompt: (
    total
  ) => `The total length of the content that I want to send you is too large to send in only one piece.

  For sending you that content, I will follow this rule:

  [START PART 1/${total}]
  this is the content of the part 1 out of ${total} in total
  [END PART 1/${total}]

  Then you just answer: "Received part 1/${total}"

  And when I tell you "ALL PARTS SENT", then you can continue processing the data and answering my requests.`,
  midPrompt: (
    no,
    total,
    message
  ) => `Do not answer yet. This is just another part of the text I want to send you. Just receive and acknowledge as "Part ${no}/${total} received" and wait for the next part.
  [START PART ${no}/${total}]
  ${message}
  [END PART ${no}/${total}]
  Remember not answering yet. Just acknowledge you received this part with the message "Part ${no}/${total} received" and wait for the next part.`,
  endPrompt: (total, message) => `[START PART ${total}/${total}]
  ${message}
  [END PART ${total}/${total}]
  ALL PARTS SENT. Now you can continue processing the request.`,
};
