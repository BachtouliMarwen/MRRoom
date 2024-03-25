const jwt = require("jsonwebtoken");

const verifyRole = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send("Token is missing");
    }
  
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).send("Token is missing");
    }
  
    const decodedToken = jwt.decode(token);
  
    console.log("decoded ", decodedToken);
    console.log("role ",decodedToken.UserInfo.role)

    if (decodedToken.UserInfo.role === "ADMIN") {
      req.userRole = "ADMIN";
      next();
    }
    else if (decodedToken.UserInfo.role === "CLIENT") {
      req.userRole = "CLIENT";
      next();
    }
    else {
      return res.status(403).json("Unauthorized: Invalid role");
    }
  };

module.exports = verifyRole;