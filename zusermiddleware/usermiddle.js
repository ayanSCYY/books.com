const { user } = require("../zdb/db")

function userMiddleware(req, res, next) {
    const username=req.body.username;
    const password=req.body.password;
    console.log('Received headers - Username:', username, 'Password:', password);
    user.findOne({
        username:username,
        password:password
    })
    .then(function(value){
        if(value){
            next();
        }
        else{
            res.json({mssg:"user or password doesn't match"})
        }
    })
}

module.exports = userMiddleware;