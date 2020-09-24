const { User } = require('./../models/user');
//this req, and response it the same req req and res from api/logout
//when user clicks on logout it will cometo auth and grab cookie,
//then verify token and fetch user. If user doent exist its going to return an error
//if user exist, then it will set the req.token and req.user with fetched user details
//then next()
let auth = function (req,res,next) {
    let token = req.cookies.auth;

    User.findByToken(token, (err, user) => {
        if (err) throw err;
        if (!user) return res.json({ error: true });

        req.token = token;
        req.user = user;

        next();
    })
}

module.exports = { auth };