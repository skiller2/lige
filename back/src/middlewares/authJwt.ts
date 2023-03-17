import * as jwt from "jsonwebtoken";
import { TokenExpiredError } from "jsonwebtoken";
export class AuthMiddleware {
  catchError = (err, res) => {
    //console.log('error', err.message);
    
    //if (err instanceof TokenExpiredError) {
    //  return res.status(401).send({ message: "Unauthorized! Access Token was expired!" });
    //}
  
    return res.status(401).json({ msg: err.message });
  }
  
  verifyToken = (req, res, next) => {
//    const token = req.headers["x-access-token"];
    
//    console.log('cabecera', req.headers.token,req.headers);
    const parsetoken = (req.headers.token) ? req.headers.token.split(" "):"";
    
    const token = (parsetoken[1])? parsetoken[1]:req.headers.token;

    if (!token) return res.status(403).json({ msg: "No token provided" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return this.catchError(err,res);

      req.decoded_token = decoded;
      next();
    });
  };
}
