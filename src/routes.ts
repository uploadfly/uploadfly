import express, { NextFunction, Request, Response } from "express";
import multer from "multer";
import { uploadFile } from "./controllers/upload";
import { deleteFile } from "./controllers/delete";
import { deleteFolder } from "./controllers/delete/all";
import { authenticateApiKey } from "./middlewares/authenticateApiKey";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/upload",
  (req: Request, res: Response, next: NextFunction) =>
    authenticateApiKey(req, res, next, "/upload"),

  upload.single("file"),
  uploadFile
);

router.delete(
  "/delete",
  (req: Request, res: Response, next: NextFunction) =>
    authenticateApiKey(req, res, next, "/delete"),
  deleteFile
);

router.delete(
  "/delete/all",
  (req: Request, res: Response, next: NextFunction) =>
    authenticateApiKey(req, res, next, "/delete/all"),

  deleteFolder
);

export { router as uploadRouter };
