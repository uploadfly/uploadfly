import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { Request, Response } from "express";
import prisma from "../../../prisma";
import filesize from "file-size";
import { generateRandomKey } from "../../utils/generateRandomKey";
import { s3Client } from "../../configs/s3";

dotenv.config();

const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()!;
};

const uploadFileToS3 = (
  file: Express.Multer.File,
  public_key: string,
  filename: string,
  route?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const params: PutObjectCommandInput = {
      Bucket: "uploadfly",
      Key: `${public_key}${route || ""}/${
        filename || file.originalname.split(".")[0]
      }-${generateRandomKey(3)}.${getFileExtension(
        file.originalname || "txt"
      )}`,
      Body: file.buffer,
    };

    const command = new PutObjectCommand(params);

    s3Client
      .send(command)
      .then(() => {
        resolve(`${params.Key}`);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
};

const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized request" });
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
      res.status(400).json({
        message: "No file uploaded",
      });
      return;
    }
    const file = req.file;
    const generatedFilename = `${file.originalname
      .replaceAll(".", "")
      .replaceAll(" ", "-")}-${generateRandomKey(6)}`;
    const filename = req.body.filename || generatedFilename;

    const filenameRegex = /^[a-zA-Z0-9_.-]+$/;

    if (filename && !filenameRegex.test(filename)) {
      res.status(400).json({
        message:
          "Filename cannot contain spaces and special characters (excluding dashes and underscores)",
      });
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

    const flyStorage = Number(fly?.storage);
    const flyUsedStorage = Number(fly?.used_storage);

    if (flyUsedStorage + fileSize > flyStorage) {
      res.status(403).json({ message: "Storage limit exceeded" });
      return;
    }

    try {
      const filePath = await uploadFileToS3(
        file,
        fly?.public_key as string,
        `${filename}-${generateRandomKey(6)}`,
        req.body.route
      );

      const newFile = await prisma.file.create({
        data: {
          name: filename,
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
        url: newFile?.url,
        path: newFile?.path,
        type: newFile?.type,
        size: filesize(fileSize).human("si"),
        name: newFile?.name,
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
};

export { uploadFile };
