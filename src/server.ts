import express, { NextFunction, Request, Response } from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import { createServer } from "http"
import { Server } from "socket.io"
import authRoutes from "./routes/auth"
import eventRoutes from "./routes/event"
import { errorHandler } from "./middleware/errorHandler"
import { rateLimiter } from "./middleware/rateLimitter"

dotenv.config()

const app = express()
const httpServer = createServer(app)
// Configure CORS for both REST API and Socket.IO
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:3000"], // Add your frontend URLs
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}

const io = new Server(httpServer, {
  cors: corsOptions
})

// Middleware
app.use(cors(corsOptions))
app.use(express.json())
app.use(rateLimiter)

// console.log("first middleware")

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
  res.header("Access-Control-Allow-Credentials", "true")
  if (req.method === "OPTIONS") {
    res.sendStatus(200)
    return
  }
  next()
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/events", eventRoutes)

// Error handling middleware
app.use(errorHandler)

// WebSocket connection
io.on("connection", (socket) => {
  console.log("A user connected")

  socket.on("disconnect", () => {
    console.log("User disconnected")
  })
})

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URL as string)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

const PORT = process.env.PORT || 3000

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export { io }

