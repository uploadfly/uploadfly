import express, { Request, Response } from "express";
import multer from "multer";
import { uploadFileToS3 } from "../controllers/upload";
import prisma from "../../prisma";
import filesize from "file-size";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized request" });
    }
    const token = req.headers.authorization.split(" ")[1];
    const apiKey = await prisma.apiKey.findUnique({
      where: {
        key: token,
      },
    });

    if (!apiKey) {
      return res
        .status(401)
        .json({ message: "Unauthorized request. API key is invalid" });
    }

    if (!apiKey.active) {
      return res
        .status(401)
        .json({ message: "Unauthorized request. API key is inactive" });
    }

    if (!req.file) {
      res.status(400).send("No file uploaded");
      return;
    }
    const file = req.file;
    const fileSize = parseInt(filesize(file.size).to("MB"));

    if (fileSize > 300) {
      res.status(400).send("Max file size is 300MB");
      return;
    }

    const fly = await prisma.fly.findUnique({
      where: {
        uuid: apiKey.fly_id,
      },
    });

    const flyStorage = fly?.storage as number;
    const flyUsedStorage = fly?.used_storage as number;

    console.log({
      fileSize,
      flyStorage,
      flyUsedStorage,
    });

    if (flyUsedStorage + fileSize > flyStorage) {
      res.status(403).json({ message: "Storage limit exceeded" });
      return;
    }

    await prisma.fly.update({
      where: {
        uuid: apiKey.fly_id,
      },
      data: {
        used_storage: flyUsedStorage + fileSize,
      },
    });

    uploadFileToS3(file)
      .then((s3Url) => {})
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error uploading file to S3");
      });

    res.send("File uploaded to S3");
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

export { router as uploadRouter };
