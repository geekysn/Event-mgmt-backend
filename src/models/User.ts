import mongoose, { Schema, Document } from "mongoose"
import bcrypt from "bcrypt"

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: "user" | "admin"
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" }
}, { timestamps: true })

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    return false
  }
}

export default mongoose.model<IUser>("User", UserSchema)
