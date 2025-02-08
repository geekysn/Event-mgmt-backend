// import mongoose from "mongoose"
// import bcrypt from "bcryptjs"

// const userSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     role: { type: String, enum: ["user", "admin"], default: "user" },
//   },
//   { timestamps: true },
// )

// userSchema.pre("save", async function (next) {
//   if (this.isModified("password")) {
//     this.password = await bcrypt.hash(this.password, 10)
//   }
//   next()
// })

// userSchema.methods.comparePassword = async function (candidatePassword: string) {
//   return bcrypt.compare(candidatePassword, this.password)
// }

// export default mongoose.model("User", userSchema)


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
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model<IUser>("User", UserSchema)
