import express from "express";
import multer from "multer";
import { uploadFile } from "./controllers/upload";
import { deleteFile } from "./controllers/delete";
import { deleteFolder } from "./controllers/delete/all";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", upload.single("file"), uploadFile);

router.delete("/delete", deleteFile);

router.delete("/delete/all", deleteFolder);

export { router as uploadRouter };
