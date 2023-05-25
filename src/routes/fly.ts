import express from "express";
import { createFly } from "../controllers/fly/create";

const router = express.Router();

router.post("/create", createFly);

export { router as flyRouter };
