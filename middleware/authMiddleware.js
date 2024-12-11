const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization header missing or invalid" });
    }
  
    const token = authHeader.split(" ")[1];
  
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach the decoded user data to the request object
      req.user = decoded.user || decoded; // Depending on how you store the user data in the token
  
      // Continue with the next middleware or route handler
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(401).json({ message: "Invalid or expired token" });
    }
  };

module.exports = { authenticateToken };
