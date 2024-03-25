const jwt = require ("jsonwebtoken")

const authenticate = (req,res,next)=>{
    const token = req.header("Authorization");
    if(!token || !token.startsWith('Bearer')){
        return res.status(401).send("Authentication failed")
    }
    try{
        //trodou fi tab w tekhou case 1 khater case 0 feha bearer
        const tokenData = token.split(' ')[1];
        const decodedToken = jwt.verify(tokenData, process.env.JWT_SECRET)
        //yzid fel req un userId bech nhout feha -id
        req.userId= decodedToken._id;
        next();
    }
    catch(err){
        return res.status(403).send({message: "Token is not valid"})
    }
}

module.exports = authenticate