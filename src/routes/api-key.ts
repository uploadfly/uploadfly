import express from "express";
import { createApiKey } from "../controllers/api-key/create";

const router = express.Router();

router.post("/create", createApiKey);

export { router as apiKeyRouter };
