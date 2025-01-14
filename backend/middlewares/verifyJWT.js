import jwt from "jsonwebtoken";

const verifyJWT = (req, res, next) => {
    const autHeaders = req.headers.authorization || req.headers.Authorization;
    if (!autHeaders?.startsWith("Bearer ")) return res.sendStatus(401);
       
    const token = authHeaders.split(" ")[1];
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) return res.sendStatus(403);
        
        req.userId = decoded.id;
        next();
    });
}



export default verifyJWT;