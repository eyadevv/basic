import axios from "axios";

export default async function SendMsg(recipientId, text) {
  try {
    const url = `https://graph.facebook.com/v12.0/me/messages`;
    await axios.post(
      url,
      {
        recipient: { id: recipientId }, // The recipient's ID (user's ID)
        message: { text }, // The message to send
      },
      {
        params: { access_token: process.env.FB_PAGE_ACCESS_TOKEN }, // Page access token
      }
    );
    console.log(`Message sent to ${recipientId}`);
  } catch (error) {
    console.error(
      "Error sending message: ",
      error.response ? error.response.data : error.message
    );
  }
}
