import express from "express"
import { Request, Response, NextFunction, RequestHandler } from "express" // Add type imports
import Event from "../models/Event"
import { authenticateJWT } from "../middleware/auth"
import { validateEventCreation } from "../middleware/validation"
import { uploadImage } from "../utils/cloudinary"
import { io } from "../server"
import multer from "multer" // Add multer for file handling
import mongoose from "mongoose"

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// Custom interface for authenticated request
interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
  file?: Express.Multer.File;
}

// Add file upload middleware

router.post("/", authenticateJWT, upload.single('image'), validateEventCreation, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, date, venue, category, capacity } = req.body
    // console.log(name, description, date, venue, category, capacity, req.file)
    // console.log(req.user)
    if (!req.user?.userId) {
      res.status(401).json({ message: "User not authenticated" })
      return; 
    }

    let imageUrl = ""
    if (req.file) {
      imageUrl = await uploadImage(req.file.buffer)
    }

    const event = new Event({
      name,
      description,
      date: new Date(date), // Ensure date is properly converted
      venue,
      category,
      capacity: parseInt(capacity, 10), // Ensure capacity is a number
      image: imageUrl,
      organizer: req.user.userId,
      attendees: [], // Initialize empty attendees array
    })
    
    await event.save()
    res.status(201).json(event)
  } catch (error) {
    next(error)
  }
})

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, startDate, endDate } = req.query
    const query: Record<string, any> = {} // Better type definition

    if (category) {
      query.category = category
    }
    
    if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate as string), 
        $lte: new Date(endDate as string) 
      }
    }

    const events = await Event.find(query)
      .populate("organizer", "name email")
      .sort({ date: 1 }) // Add sorting by date
      .lean() // Optimize query performance
    
    res.json(events)
  } catch (error) {
    next(error)
  }
})

router.get("/:id", async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name email")
      .populate("attendees", "name email") // Also populate attendees
      .lean()

    if (!event) {
      res.status(404).json({ message: "Event not found" })
      return 
    }
    
    res.json(event)
  } catch (error) {
    next(error)
  }
})

router.put("/:id", authenticateJWT, validateEventCreation, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: "User not authenticated" })
      return 
    }

    const event = await Event.findById(req.params.id)
    
    if (!event) {
      res.status(404).json({ message: "Event not found" })
      return 
    }

    if (event.organizer.toString() !== req.user.userId) {
      res.status(403).json({ message: "Not authorized to update this event" })
      return 
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, date: new Date(req.body.date) },
      { new: true, runValidators: true }
    ).populate("organizer", "name email")

    res.json(updatedEvent)
  } catch (error) {
    next(error)
  }
})

router.delete("/:id", authenticateJWT, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: "User not authenticated" })
      return 
    }

    const event = await Event.findById(req.params.id)
    
    if (!event) {
      res.status(404).json({ message: "Event not found" })
      return 
    }

    if (event.organizer.toString() !== req.user.userId) {
      res.status(403).json({ message: "Not authorized to delete this event" })
      return 
    }

    await Event.findByIdAndDelete(req.params.id)
    
    // Notify all connected clients about event deletion
    io.emit("eventDeleted", { eventId: req.params.id })
    
    res.json({ message: "Event deleted successfully" })
  } catch (error) {
    next(error)
  }
})

router.post("/:id/attend", authenticateJWT, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: "User not authenticated" })
      return 
    }

    const event = await Event.findById(req.params.id)
    
    if (!event) {
      res.status(404).json({ message: "Event not found" })
      return 
    }

    if (event.attendees.includes(new mongoose.Types.ObjectId(req.user.userId))) {
      res.status(400).json({ message: "Already attending this event" })
      return 
    }

    // Check if event is at capacity
    if (event.attendees.length >= event.capacity) {
      res.status(400).json({ message: "Event is at full capacity" })
      return 
    }

    event.attendees.push(new mongoose.Types.ObjectId(req.user.userId))
    await event.save()

    // Emit a real-time update
    io.emit("attendeeUpdate", { 
      eventId: event._id, 
      attendeeCount: event.attendees.length,
      capacity: event.capacity 
    })

    res.json({ 
      message: "Successfully joined the event",
      attendeeCount: event.attendees.length,
      capacity: event.capacity
    })
  } catch (error) {
    next(error)
  }
})

export default router