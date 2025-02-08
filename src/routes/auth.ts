import express, { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import User from "../models/User"
import { validateRegistration, validateLogin } from "../middleware/validation"


const router = express.Router()

router.post("/register", validateRegistration, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body
    const existingUser = await User.findOne({ email })
    // console.log("first");
    if (existingUser) {
      res.status(400).json({ message: "User already exists" })
      return 
    }
    const user = new User({ name, email, password })
    await user.save()
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: "1d" })
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } })
  } catch (error) {
    next(error)
  }
})

router.post("/login", validateLogin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: "Invalid credentials" })
      return 
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: "1d" })
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } })
  } catch (error) {
    next(error)
  }
})

router.post("/guest", (req, res) => {
  const token = jwt.sign({ userId: "guest" }, process.env.JWT_SECRET as string, { expiresIn: "1d" })
  res.json({ token, user: { id: "guest", name: "Guest", email: "guest@example.com" } })
})

export default router

