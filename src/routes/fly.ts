import express, { Request, Response } from "express";
import { createFly } from "../controllers/fly/create";
import { getUserFlies } from "../controllers/fly/get-user-flies";

const router = express.Router();

router.post("/create", createFly);
router.get("/list", getUserFlies);

export { router as flyRouter };
