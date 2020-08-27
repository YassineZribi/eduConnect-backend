const { sendSMS } = require("orange-connect");

async function sendMessage(to, message) {
    try {
        const response = await sendSMS({
            authorizationHeader: process.env.ORANGE_SMS_API_AUTHORIZATION_HEADER, // Your Authorization Header that you get from your Orange SMS APP Settings
            from: "+21600000000", // Your Orange account's phone number
            to,
            message
        });
        console.log("response", response);
    } catch (error) {
        console.log("error", error);
    }
}

module.exports = {
    sendMessage
};