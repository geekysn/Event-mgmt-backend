import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

declare module "express" {
  export interface Request {
    user?: any;
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (authHeader) {
    const token = authHeader.split(" ")[1]
    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
      if (err) {
        res.sendStatus(403)
        return 
      }
      req.user = user
      next()
    })
  } else {
    res.sendStatus(401)
  }
}

