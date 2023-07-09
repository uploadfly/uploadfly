import express, { Request, Response } from "express";
import multer from "multer";
import { uploadFile } from "./controllers/upload";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("file"), uploadFile);

export { router as uploadRouter };
