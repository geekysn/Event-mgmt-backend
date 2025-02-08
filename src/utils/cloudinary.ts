import { v2 as cloudinary } from "cloudinary"
import dotenv from "dotenv"
dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})
// console.log("hi ",cloudinary.config());
export const uploadImage = async (file: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {

    cloudinary.uploader
        .upload_stream({ resource_type: "auto" }, (error, result) => {
            if (error) reject(error)
            else resolve(result!.secure_url)
        })
        .end(file)
  })
}

