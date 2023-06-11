import express, { Request, Response } from "express";
import multer from "multer";
import { uploadFileToS3 } from "./controllers/upload";
import prisma from "../prisma";
import filesize from "file-size";
import { generateRandomKey } from "./utils/generateRandomKey";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized request" });
    }

    const filePath = req.body.route.split("/");

    console.log(filePath);

    if (!filePath.length) {
      return res.status(400).json({ message: "Invalid route" });
    }

    if (filePath.length > 6) {
      return res
        .status(400)
        .json({ message: "Too many route levels, maximum is 6" });
    }

    const token = req.headers.authorization.split(" ")[1];
    console.log(token);

    const apiKeyByPublicKey = await prisma.apiKey.findUnique({
      where: {
        public_key: token,
      },
    });

    const apiKeyBySecretKey = await prisma.apiKey.findUnique({
      where: {
        secret_key: token,
      },
    });

    const apiKey = apiKeyByPublicKey || apiKeyBySecretKey;

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
    const filename = req.body.filename;

    const filenameRegex = /^[a-zA-Z0-9_.-]+$/;

    if (filename && !filenameRegex.test(filename)) {
      res.status(400).json({ message: "Invalid filename" });
      return;
    }
    const fileSize = file.size;

    if (fileSize > 314572800) {
      res.status(400).send("Max file size is 300MB");
      return;
    }

    const fly = await prisma.fly.findUnique({
      where: {
        uuid: apiKey.fly_id,
      },
    });

    if (!fly) {
      res.status(404).json({ message: "Fly not found" });
      return;
    }

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

    try {
      const filePath = await uploadFileToS3(
        file,
        fly?.public_key as string,
        filename,
        req.body.route
      );
      const newFile = await prisma.file.create({
        data: {
          name:
            filename ||
            `${file.originalname.replaceAll(".", "")}_${generateRandomKey(4)}`,
          url: `${process.env.AWS_CLOUDFRONT_URL}/${filePath}` as string,
          path: filePath as string,
          uploaded_via: "REST API",
          parent_folder_id: "",
          type: file.mimetype,
          size: fileSize,
          fly_id: apiKey.fly_id,
        },
      });
      res.status(200).json({
        ...newFile,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("File upload failed");
    }
    await prisma.fly.update({
      where: {
        uuid: apiKey.fly_id,
      },
      data: {
        used_storage: flyUsedStorage + fileSize,
      },
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

export { router as uploadRouter };
