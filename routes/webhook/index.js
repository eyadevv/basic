// Register formbody for parsing incoming requests

import SendMsg from "../../lib/msg";
module.exports = async function (fastify, opts) {
  fastify.get("/", (request, reply) => {
    const VERIFY_TOKEN = "eyadevv";
    const mode = request.query["hub.mode"];
    const token = request.query["hub.verify_token"];
    const challenge = request.query["hub.challenge"];

    return mode === "subscribe" && token === VERIFY_TOKEN
      ? reply.send(challenge)
      : reply.code(403).send("Verification failed");
  });

  // Message handling
  fastify.post("/", async (request, reply) => {
    const messagingEvents = request?.body.entry[0].messaging;
    // console.log(messagingEvents);
    for (const event of messagingEvents) {
      const senderId = event.sender.id; // Sender's user ID
      const messageText = event?.message;
      await sendTextMessage(senderId, `You MSG Is : ${messageText}`);
      await sendTextMessage(senderId, `Thanks for testing the bot BYE`);

      console.log(messageText);
    }

    reply.send("EVENT_RECEIVED");
  });
};
