import dotenv from "dotenv";
dotenv.config();

export const isProd = process.env.NODE_ENV === "production";
