const jwt = require('jsonwebtoken');
require('dotenv').config();

// our middleware
module.exports = function (req, res, next) {
    // Get token from header (When we send a request from our front to a protected route we need to send the token within a header )
    const token = req.headers['x-auth-token'];
    //or
    // const token = req.header('x-auth-token'); 

    // if there is no token getting back 
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' }); // 401 : not authorized

    // verify token and if everything is going well we get back the payload (payload decrypted)
    try {
        const verifiedAndDecoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = verifiedAndDecoded.user;
        next();
    } catch (err) {
        // that's will run if the token is not valid
        return res.status(401).json({ msg: 'Token in not valid' });

    }

};