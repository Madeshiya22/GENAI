import dotenv from "dotenv";

dotenv.config();

if (!process.env.MISTRAL_API_KEY) {
  throw new Error(
    "Error: MISTRAL_API_KEY is not set in the environment variables.",
  );
}

if (!process.env.JWT_SECRET) {
  throw new Error("Error: JWT_SECRET is not set in the environment variables.");
}

if (!process.env.MONGODB_URI) {
  throw new Error(
    "Error: MONGODB_URI is not set in the environment variables.",
  );
}

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error(
    "Error: GOOGLE_CLIENT_ID is not set in the environment variables.",
  );
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error(
    "Error: GOOGLE_CLIENT_SECRET is not set in the environment variables.",
  );
}

if (!process.env.GOOGLE_REDIRECT_URI) {
  throw new Error(
    "Error: GOOGLE_REDIRECT_URI is not set in the environment variables.",
  );
}

if (!process.env.CLIENT_URL) {
  throw new Error("Error: CLIENT_URL is not set in the environment variables.");
}

if (!process.env.PORT) {
  console.warn(
    "Warning: PORT is not set in the environment variables. Defaulting to 3000.",
  );
}

export default {
  PORT: process.env.PORT || 3000,
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  MONGODB_URI: process.env.MONGODB_URI,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  CLIENT_URL: process.env.CLIENT_URL,
};
