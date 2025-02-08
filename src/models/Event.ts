import mongoose from "mongoose"

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    venue: { type: String, required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    category: { type: String, required: true },
    capacity: { type: Number, required: true },
    image: { type: String },
  },
  { timestamps: true },
)

export default mongoose.model("Event", eventSchema)

