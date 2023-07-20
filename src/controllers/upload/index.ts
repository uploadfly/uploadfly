import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { Response } from "express";
import prisma from "../../../prisma";
import filesize from "file-size";
import { generateRandomKey } from "../../utils/generateRandomKey";
import { s3Client } from "../../configs/s3";
import { IRequest } from "../../interfaces";
import { sendError, sendResponse } from "../../utils/resolveRequest";

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
    const fileExtension = getFileExtension(file.originalname || "txt");
    const routeOrDefault = route || "";
    const params: PutObjectCommandInput = {
      Bucket: "uploadfly",
      Key: `${public_key}${routeOrDefault}/${filename}.${fileExtension}`,
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

const uploadFile = async (req: IRequest, res: Response) => {
  try {
    const { apiKey } = req;

    if (!req.file) {
      return sendError(res, "No file provided", 400);
    }
    const file = req.file;

    const filename = req.body.filename;

    const filenameRegex = /^[a-zA-Z0-9_.-]+$/;

    if (filename && !filenameRegex.test(filename)) {
      return sendError(
        res,
        "Filename cannot contain spaces and special characters (excluding dashes and underscores)",
        400
      );
    }
    const fileSize = file.size;

    if (fileSize > 300000000) {
      return sendError(res, "File size cannot exceed 300MB", 400);
    }

    const fly = await prisma.fly.findUnique({
      where: {
        uuid: apiKey?.fly_id,
      },
    });

    if (!fly) {
      return sendError(res, "Fly not found", 404);
    }

    const flyStorage = Number(fly?.storage);
    const flyUsedStorage = Number(fly?.used_storage);

    if (flyUsedStorage + fileSize > flyStorage) {
      return sendError(res, "Storage limit exceeded", 403);
    }
    const generatedName = filename
      ? `${filename}-${generateRandomKey(8)}`
      : generateRandomKey(16);
    try {
      const filePath = await uploadFileToS3(
        file,
        fly?.public_key as string,
        `${generatedName}`,
        req.body.route
      );

      const newFile = await prisma.file.create({
        data: {
          name: generatedName,
          url: `${process.env.AWS_CLOUDFRONT_URL}/${filePath}` as string,
          path: filePath as string,
          uploaded_via: "REST API",
          parent_folder_id: "",
          type: file.mimetype,
          size: fileSize,
          fly_id: apiKey?.fly_id as string,
        },
      });
      sendResponse(res, {
        url: newFile?.url,
        path: newFile?.path,
        type: newFile?.type,
        size: filesize(fileSize).human("si"),
        name: newFile?.name,
      });
    } catch (err) {
      console.error(err);
      sendError(res, "File upload failed", 500);
    }
    await prisma.fly.update({
      where: {
        uuid: apiKey?.fly_id,
      },
      data: {
        used_storage: flyUsedStorage + fileSize,
      },
    });
  } catch (error) {
    console.log(error);
    sendError(res, "File upload failed", 500);
  }
};

export { uploadFile };
