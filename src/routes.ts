import express, { NextFunction, Request, Response } from "express";
import multer from "multer";
import { uploadFile } from "./controllers/upload";
import { deleteFile } from "./controllers/delete";
import { deleteFolder } from "./controllers/delete/all";
import { authenticateApiKey } from "./middlewares/authenticateApiKey";
import { uploadImage } from "./controllers/image/upload";
// import {
//   apiKeys,
//   domains,
//   emailResets,
//   files,
//   logs,
//   projects,
//   refreshTokens,
//   users,
// } from "./controllers/db";

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

router.post(
  "/image/upload",
  (req: Request, res: Response, next: NextFunction) =>
    authenticateApiKey(req, res, next, "/image/upload"),
  upload.single("file"),
  uploadImage
);

//temp

/*router.get("/db/users", users);
router.get("/db/emailresets", emailResets);
router.get("/db/projects", projects);
router.get("/db/files", files);
router.get("/db/domains", domains);
router.get("/db/apikeys", apiKeys);
router.get("/db/logs", logs);
router.get("/db/refreshtokens", refreshTokens);*/

export { router as ufRouter };
