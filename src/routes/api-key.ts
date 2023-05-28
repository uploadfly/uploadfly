import express from "express";
import { createApiKey } from "../controllers/api-key/create";
import { getUserApiKeys } from "../controllers/api-key/get-user-api-keys";

const router = express.Router();

router.post("/create", createApiKey);
router.get("/list", getUserApiKeys);

export { router as apiKeyRouter };
