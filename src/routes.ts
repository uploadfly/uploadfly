import express, { Request, Response } from "express";
import multer from "multer";
import { uploadFile } from "./controllers/upload";
import { deleteFile } from "./controllers/delete";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", upload.single("file"), uploadFile);
router.delete("/delete", deleteFile);

export { router as uploadRouter };
