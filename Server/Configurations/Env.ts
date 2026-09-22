import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url),
  __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env"),
});

export const DATABASE_URL = process.env.DATABASE_URL,
  CACHE_URL = process.env.REDIS_URL,
  REDIRECT_LINK = process.env.REDIRECT_LINK,
  PORT = process.env.PORT,
  JWT_SECRET = process.env.JWT_SECRET,
  RESEND_KEY = process.env.RESEND_KEY,
  RESEND_SUBSCRIBERS_SEGMENT_ID = process.env.RESEND_SUBSCRIBERS_SEGMENT_ID,
  RESEND_LISTING_ALERT_TEMPLATE_ID = process.env.RESEND_LISTING_ALERT_TEMPLATE_ID,
  CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
