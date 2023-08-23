import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { Response } from "express";
import prisma from "../../../prisma";
import filesize from "file-size";
import { generateRandomKey } from "../../utils/generateRandomKey";
import { s3Client } from "../../configs/s3";
import { IRequest } from "../../interfaces";
import { sendError, sendResponse } from "../../utils/resolveRequest";
import dayjs from "dayjs";
import parseDataSize from "../../utils/parseDataSize";

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
      Key:
        `${public_key}${routeOrDefault}/${filename}.${fileExtension}` ||
        `${public_key}/${routeOrDefault}/${file.originalname}`,
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
  const err = (message: string, status: number) => {
    sendError({
      endpoint: "/upload",
      error: {
        message,
      },
      fly_id: req.apiKey?.fly_id as string,
      method: "post",
      req,
      res,
      status,
    });
  };
  try {
    const { apiKey } = req;

    if (!req.file) {
      return err("No file provided", 400);
    }
    const file = req.file;

    const {
      filename,
      maxFileSize,
      allowedFileTypes,
    }: { filename: string; maxFileSize: string; allowedFileTypes: string } =
      req.body;

    const filenameRegex = /^[a-zA-Z0-9_.-]+$/;

    if (filename && !filenameRegex.test(filename)) {
      return err(
        "Filename cannot contain spaces and special characters (excluding dashes and underscores)",
        400
      );
    }
    const fileSize = file.size;
    let parsedFileSize;

    if (maxFileSize) {
      parsedFileSize = parseDataSize(maxFileSize);
    }

    if (parsedFileSize?.error) {
      return err("Invalid maxFileSzie value", 400);
    }

    if (fileSize > parsedFileSize?.result!) {
      return err(`File size cannot excceed ${maxFileSize.toUpperCase()}`, 400);
    }

    if (fileSize > 300000000) {
      return err("File size cannot exceed 300MB", 400);
    }

    const fly = await prisma.fly.findUnique({
      where: {
        uuid: apiKey?.fly_id,
      },
    });

    let allowedFileTypesToArray;

    if (allowedFileTypes) {
      allowedFileTypesToArray = allowedFileTypes.split(",");
    }

    const uppercaseAllowedFileTypes = allowedFileTypesToArray?.map(
      (value: string) => value.toUpperCase().trim()
    );

    if (
      allowedFileTypes &&
      !uppercaseAllowedFileTypes?.includes(
        file.mimetype.split("/")[1].toUpperCase()
      )
    ) {
      return err("Invalid file type", 400);
    }

    if (!fly) {
      return err("Fly not found", 404);
    }

    const flyStorage = Number(fly?.storage);
    const flyUsedStorage = Number(fly?.used_storage);

    if (flyUsedStorage + fileSize > flyStorage) {
      return err("Storage limit exceeded", 403);
    }

    const fileNameWithExtension =
      filename &&
      `${filename}.${getFileExtension(
        file.originalname || "txt"
      ).toLowerCase()}`;

    function getFileNameWithoutExtension(filename: string): string {
      const lastDotIndex = filename.lastIndexOf(".");

      if (lastDotIndex <= 0) {
        return filename;
      }

      const filenameWithoutExtension = filename.substring(0, lastDotIndex);

      return filenameWithoutExtension;
    }

    try {
      const filePath = await uploadFileToS3(
        file,
        fly?.public_key as string,
        filename || getFileNameWithoutExtension(file.originalname),
        req.body.route
      );

      const newFile = await prisma.file.create({
        data: {
          name: fileNameWithExtension || file.originalname,
          url: encodeURI(`${process.env.AWS_CLOUDFRONT_URL}/${filePath}`),
          path: filePath as string,
          uploaded_via: "REST API",
          parent_folder_id: "",
          type: file.mimetype,
          size: fileSize,
          fly_id: apiKey?.fly_id as string,
          date: dayjs().format("YYYY-MM-DD"),
        },
      });
      sendResponse({
        res,
        req,
        data: {
          url: newFile?.url,
          path: newFile?.path,
          type: newFile?.type,
          size: filesize(fileSize).human("si"),
          name: newFile?.name,
        },
        status: 201,
        endpoint: "/upload",
        method: "post",
        fly_id: fly.uuid,
      });
    } catch (error) {
      err("File upload failed", 500);
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
    err("File upload failed", 500);
  }
};

export { uploadFile };
