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
  RESEND_KEY = process.env.RESEND_KEY;
