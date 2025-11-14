import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  vapiPublicKey: process.env.VAPI_PUBLIC_KEY,
  vapiSecretKey: process.env.VAPI_SECRET_KEY,
  googleApiKey: process.env.GEMINI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || "development",
};

export default config;
