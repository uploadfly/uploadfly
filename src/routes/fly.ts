import express, { Request, Response } from "express";
import { createFly } from "../controllers/fly/create";

const router = express.Router();

router.post("/create", createFly);
router.get("/hehe", async (req: Request, res: Response) => {
  res.send(req.cookies);
});

export { router as flyRouter };
