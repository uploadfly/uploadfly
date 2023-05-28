import express, { Request, Response } from "express";
import multer from "multer";
import { uploadFileToS3 } from "../controllers/upload";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("file"), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).send("No file uploaded");
      return;
    }
    const file = req.file;

    uploadFileToS3(file)
      .then((s3Url) => {
        res.send("File uploaded to S3");
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error uploading file to S3");
      });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

export { router as uploadRouter };
